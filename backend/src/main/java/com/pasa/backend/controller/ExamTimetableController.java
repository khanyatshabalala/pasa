package com.pasa.backend.controller;

import com.pasa.backend.dto.request.CreateExamEntryRequest;
import com.pasa.backend.dto.response.ExamEntryResponse;
import com.pasa.backend.service.ExamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/exam-timetable")
public class ExamTimetableController {

    private final ExamService examService;

    public ExamTimetableController(ExamService examService) {
        this.examService = examService;
    }

    @GetMapping
    public List<ExamEntryResponse> getTimetable(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer term
    ) {
        return examService.getTimetable(schoolId, year, term);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ExamEntryResponse> createEntry(
            @PathVariable UUID schoolId,
            @Valid @RequestBody CreateExamEntryRequest req,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.createEntry(schoolId, req, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ExamEntryResponse updateEntry(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateExamEntryRequest req
    ) {
        return examService.updateEntry(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEntry(@PathVariable UUID schoolId, @PathVariable UUID id) {
        examService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }
}
