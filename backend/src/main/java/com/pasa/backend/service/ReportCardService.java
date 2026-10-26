package com.pasa.backend.service;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.ReportCard;
import com.pasa.backend.dto.response.ReportCardResponse;
import com.pasa.backend.mapper.ReportCardMapper;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.ReportCardRepository;
import com.pasa.backend.security.LearnerAccessGuard;
import com.pasa.backend.storage.StorageObject;
import com.pasa.backend.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReportCardService {

    private static final Logger log = LoggerFactory.getLogger(ReportCardService.class);

    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final int MAX_NOTES_LEN = 300;
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private final StorageService storage;
    private final ReportCardRepository reportCardRepo;
    private final LearnerRepository learnerRepo;
    private final JdbcTemplate jdbc;
    private final LearnerAccessGuard accessGuard;

    public ReportCardService(StorageService storage,
                             ReportCardRepository reportCardRepo,
                             LearnerRepository learnerRepo,
                             JdbcTemplate jdbc,
                             LearnerAccessGuard accessGuard) {
        this.storage = storage;
        this.reportCardRepo = reportCardRepo;
        this.learnerRepo = learnerRepo;
        this.jdbc = jdbc;
        this.accessGuard = accessGuard;
    }

    // ── Queries ───────────────────────────────────────────────────────────

    public List<ReportCardResponse> listByLearner(UUID learnerId, UUID userId) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanAccessLearner(learnerId, userId);
        return reportCardRepo.findByLearnerIdOrderByAcademicYearDescTermDesc(learnerId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ReportCardResponse> listBySchool(UUID schoolId) {
        return reportCardRepo.findBySchoolIdOrderByAcademicYearDescTermDesc(schoolId).stream()
                .map(this::toResponse)
                .toList();
    }

    public StorageObject download(UUID learnerId, UUID reportCardId, UUID userId) {
        ReportCard rc = reportCardRepo.findById(reportCardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report card not found"));
        if (!rc.getLearnerId().equals(learnerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report card not found");
        }
        accessGuard.assertCanAccessLearner(learnerId, userId);
        return storage.download(rc.getFilePath());
    }

    // ── Commands ──────────────────────────────────────────────────────────

    public ReportCardResponse upload(UUID learnerId, MultipartFile file, Integer term,
                                     Integer academicYear, String notes, UUID userId) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanManageLearner(learnerId, userId);

        validate(file, term, academicYear, notes);

        UUID schoolId = learner.getSchool().getId();
        String key = schoolId + "/" + learnerId + "/" + academicYear + "_T" + term + ".pdf";

        // Upload to storage FIRST, then persist. Compensate (delete object) on DB failure.
        try {
            storage.upload(key, file.getInputStream(), file.getSize(), PDF_CONTENT_TYPE);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded file");
        }

        try {
            ReportCard rc = reportCardRepo.findByLearnerIdAndAcademicYearAndTerm(learnerId, academicYear, term)
                    .orElseGet(ReportCard::new);
            rc.setLearnerId(learnerId);
            rc.setSchoolId(schoolId);
            rc.setAcademicYear(academicYear);
            rc.setTerm(term);
            rc.setFilePath(key);
            rc.setFileName(originalFileName(file));
            rc.setUploadedBy(userId);
            rc.setNotes(notes);
            ReportCard saved = reportCardRepo.save(rc);
            return toResponse(saved);
        } catch (RuntimeException e) {
            // Compensate: remove the just-uploaded object so storage and DB don't diverge.
            try {
                storage.delete(key);
            } catch (RuntimeException cleanup) {
                log.warn("Failed to compensate storage object {} after DB failure", key, cleanup);
            }
            throw e;
        }
    }

    public void delete(UUID learnerId, UUID reportCardId, UUID userId) {
        ReportCard rc = reportCardRepo.findById(reportCardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report card not found"));
        if (!rc.getLearnerId().equals(learnerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report card not found");
        }
        accessGuard.assertCanManageLearner(learnerId, userId);
        reportCardRepo.delete(rc);
        try {
            storage.delete(rc.getFilePath());
        } catch (RuntimeException e) {
            log.warn("Deleted report card row {} but failed to delete storage object {}", reportCardId, rc.getFilePath(), e);
        }
    }

    // ── Validation & access ─────────────────────────────────────────────────

    private void validate(MultipartFile file, Integer term, Integer academicYear, String notes) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        if (!PDF_CONTENT_TYPE.equalsIgnoreCase(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only PDF files are accepted");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file exceeds 10 MB");
        }
        if (term == null || term < 1 || term > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "term must be between 1 and 4");
        }
        int currentYear = Year.now().getValue();
        if (academicYear == null || academicYear < 2000 || academicYear > currentYear + 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "academicYear is out of range");
        }
        if (notes != null && notes.length() > MAX_NOTES_LEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "notes must be at most 300 characters");
        }
    }


    // ── Helpers ───────────────────────────────────────────────────────────

    private ReportCardResponse toResponse(ReportCard rc) {
        String uploadedByName = null;
        if (rc.getUploadedBy() != null) {
            uploadedByName = queryForString(
                "SELECT full_name FROM public.profiles WHERE id = ?", rc.getUploadedBy());
        }
        Map<String, Object> learner = queryForRow(
            "SELECT first_name, last_name FROM public.learners WHERE id = ?", rc.getLearnerId());
        String firstName = learner == null ? null : str(learner.get("first_name"));
        String lastName = learner == null ? null : str(learner.get("last_name"));
        return ReportCardMapper.toResponse(rc, uploadedByName, firstName, lastName);
    }

    private String queryForString(String sql, Object param) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, param);
        return rows.isEmpty() ? null : str(rows.get(0).values().iterator().next());
    }

    private Map<String, Object> queryForRow(String sql, Object param) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, param);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private static String originalFileName(MultipartFile file) {
        String name = file.getOriginalFilename();
        return (name == null || name.isBlank()) ? "report-card.pdf" : name;
    }
}
