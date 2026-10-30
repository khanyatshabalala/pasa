package com.pasa.backend.calendar;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class ExamService {

    private final ExamTimetableRepository examRepo;
    private final SchoolRepository schoolRepo;

    public ExamService(ExamTimetableRepository examRepo, SchoolRepository schoolRepo) {
        this.examRepo = examRepo;
        this.schoolRepo = schoolRepo;
    }

    public List<ExamEntryResponse> getTimetable(UUID schoolId, Integer year, Integer term) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        int academicYear = year != null ? year : Year.now().getValue();

        List<ExamTimetable> entries;
        if (term != null) {
            entries = examRepo.findBySchoolIdAndAcademicYearAndTermOrderByExamDateAsc(schoolId, academicYear, term);
        } else {
            entries = examRepo.findBySchoolIdAndAcademicYearOrderByExamDateAsc(schoolId, academicYear);
        }
        return entries.stream().map(ExamTimetableMapper::toResponse).toList();
    }

    public ExamEntryResponse createEntry(UUID schoolId, CreateExamEntryRequest req, UUID userId) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        ExamTimetable entry = ExamTimetableMapper.toEntity(req);
        entry.setSchool(school);
        entry.setCreatedBy(userId);
        if (entry.getAcademicYear() == null) {
            entry.setAcademicYear(Year.now().getValue());
        }
        return ExamTimetableMapper.toResponse(examRepo.save(entry));
    }

    public ExamEntryResponse updateEntry(UUID id, CreateExamEntryRequest req) {
        ExamTimetable existing = examRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        existing.setSubject(req.subject());
        existing.setGradeId(req.gradeId());
        existing.setExamDate(req.examDate());
        existing.setStartTime(req.startTime());
        existing.setEndTime(req.endTime());
        existing.setVenue(req.venue());
        existing.setNotes(req.notes());
        existing.setTerm(req.term());
        return ExamTimetableMapper.toResponse(examRepo.save(existing));
    }

    public void deleteEntry(UUID id) {
        ExamTimetable entry = examRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        examRepo.delete(entry);
    }
}
