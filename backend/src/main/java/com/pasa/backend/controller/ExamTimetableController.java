package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.ExamTimetable;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.ExamTimetableRepository;
import com.pasa.backend.repository.SchoolRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/exam-timetable")
public class ExamTimetableController {

    private final ExamTimetableRepository examRepo;
    private final SchoolRepository schoolRepo;

    public ExamTimetableController(ExamTimetableRepository examRepo, SchoolRepository schoolRepo) {
        this.examRepo = examRepo;
        this.schoolRepo = schoolRepo;
    }

    @GetMapping
    public List<ExamTimetable> getTimetable(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer term
    ) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        int academicYear = year != null ? year : Year.now().getValue();

        if (term != null) {
            return examRepo.findBySchoolIdAndAcademicYearAndTermOrderByExamDateAsc(schoolId, academicYear, term);
        }
        return examRepo.findBySchoolIdAndAcademicYearOrderByExamDateAsc(schoolId, academicYear);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ExamTimetable> createEntry(
            @PathVariable UUID schoolId,
            @Valid @RequestBody ExamTimetable entry,
            Authentication auth
    ) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        entry.setSchool(school);
        entry.setCreatedBy((UUID) auth.getPrincipal());
        if (entry.getAcademicYear() == null) {
            entry.setAcademicYear(Year.now().getValue());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(examRepo.save(entry));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ExamTimetable updateEntry(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody ExamTimetable updated
    ) {
        ExamTimetable existing = examRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        existing.setSubject(updated.getSubject());
        existing.setGradeId(updated.getGradeId());
        existing.setExamDate(updated.getExamDate());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setVenue(updated.getVenue());
        existing.setNotes(updated.getNotes());
        existing.setTerm(updated.getTerm());
        return examRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEntry(@PathVariable UUID schoolId, @PathVariable UUID id) {
        ExamTimetable entry = examRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        examRepo.delete(entry);
        return ResponseEntity.noContent().build();
    }
}
