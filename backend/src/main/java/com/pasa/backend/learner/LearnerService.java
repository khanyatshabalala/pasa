package com.pasa.backend.learner;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.ParentLinkRepository;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.schoolclass.SchoolClassRepository;
import com.pasa.backend.security.LearnerAccessGuard;
import com.pasa.backend.security.SchoolAccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LearnerService {

    private final LearnerRepository learnerRepo;
    private final SchoolRepository schoolRepo;
    private final SchoolClassRepository classRepo;
    private final LearnerAccessGuard accessGuard;
    private final SchoolAccessGuard schoolAccessGuard;
    private final ParentLinkRepository parentLinkRepo;

    public LearnerService(LearnerRepository learnerRepo, SchoolRepository schoolRepo,
                          SchoolClassRepository classRepo, LearnerAccessGuard accessGuard,
                          SchoolAccessGuard schoolAccessGuard, ParentLinkRepository parentLinkRepo) {
        this.learnerRepo = learnerRepo;
        this.schoolRepo = schoolRepo;
        this.classRepo = classRepo;
        this.accessGuard = accessGuard;
        this.schoolAccessGuard = schoolAccessGuard;
        this.parentLinkRepo = parentLinkRepo;
    }

    // ── Class name lookup helper ───────────────────────────────────────────
    // Build a map of classId → className for a school's current year so we
    // can populate className in one query instead of N queries.
    private Map<UUID, String> classNameMap(UUID schoolId) {
        return classRepo.findBySchoolIdAndAcademicYear(schoolId, java.time.Year.now().getValue())
                .stream()
                .collect(Collectors.toMap(
                    c -> c.getId(),
                    c -> c.getName(),
                    (a, b) -> a
                ));
    }

    public List<LearnerResponse> getMyChildren(UUID parentId) {
        return learnerRepo.findByParentUserId(parentId).stream()
                .map(l -> {
                    // For parent-facing children list, resolve class name per learner.
                    String cn = null;
                    if (l.getClassId() != null) {
                        cn = classRepo.findById(l.getClassId())
                                .map(c -> c.getName()).orElse(null);
                    }
                    var link = parentLinkRepo.findByParentUserIdAndLearnerId(parentId, l.getId())
                            .orElseThrow(() -> new IllegalStateException("Parent learner query returned an unlinked learner"));
                    return LearnerMapper.toParentResponse(l, cn, link.getRelationship(), link.getIsPrimary());
                })
                .toList();
    }

    public List<LearnerResponse> getLearnersBySchool(UUID schoolId, UUID userId) {
        schoolAccessGuard.assertCanAccessSchool(schoolId, userId);
        if (!schoolRepo.existsById(schoolId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found");
        }
        Map<UUID, String> classNames = classNameMap(schoolId);
        return learnerRepo.findBySchoolId(schoolId).stream()
                .map(l -> LearnerMapper.toResponse(l, l.getClassId() != null ? classNames.get(l.getClassId()) : null))
                .toList();
    }

    public LearnerResponse getLearner(UUID id, UUID userId) {
        Learner learner = learnerRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanAccessLearner(id, userId);
        String cn = null;
        if (learner.getClassId() != null) {
            cn = classRepo.findById(learner.getClassId()).map(c -> c.getName()).orElse(null);
        }
        return LearnerMapper.toResponse(learner, cn);
    }

    public LearnerResponse createLearner(UUID schoolId, CreateLearnerRequest req, UUID userId) {
        schoolAccessGuard.assertCanManageSchool(schoolId, userId);
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        validateClassSchool(schoolId, req.classId());

        // If a classId is provided, derive the grade from the class if gradeId was not set.
        Integer gradeId = req.gradeId();
        if (gradeId == null && req.classId() != null) {
            gradeId = classRepo.findById(req.classId())
                    .map(c -> c.getGradeId())
                    .orElse(null);
        }

        Learner learner = LearnerMapper.toEntity(req);
        learner.setSchool(school);
        learner.setGradeId(gradeId);
        learner = learnerRepo.save(learner);
        String cn = req.classId() != null
                ? classRepo.findById(req.classId()).map(c -> c.getName()).orElse(null) : null;
        return LearnerMapper.toResponse(learner, cn);
    }

    public LearnerResponse updateLearner(UUID id, CreateLearnerRequest req, UUID userId) {
        Learner existing = learnerRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanManageLearner(id, userId);
        validateClassSchool(existing.getSchool().getId(), req.classId());

        Integer gradeId = req.gradeId();
        if (gradeId == null && req.classId() != null) {
            gradeId = classRepo.findById(req.classId())
                    .map(c -> c.getGradeId())
                    .orElse(existing.getGradeId());
        }

        existing.setFirstName(req.firstName());
        existing.setLastName(req.lastName());
        existing.setDateOfBirth(req.dateOfBirth());
        existing.setGradeId(gradeId != null ? gradeId : existing.getGradeId());
        existing.setLearnerNumber(req.learnerNumber());
        existing.setGender(req.gender());
        existing.setClassId(req.classId());
        existing = learnerRepo.save(existing);
        String cn = existing.getClassId() != null
                ? classRepo.findById(existing.getClassId()).map(c -> c.getName()).orElse(null) : null;
        return LearnerMapper.toResponse(existing, cn);
    }

    private void validateClassSchool(UUID schoolId, UUID classId) {
        if (classId == null) return;
        var schoolClass = classRepo.findById(classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found"));
        if (!schoolClass.getSchool().getId().equals(schoolId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class must belong to this school");
        }
    }
}
