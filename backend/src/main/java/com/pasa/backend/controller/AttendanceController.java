package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.Attendance;
import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.repository.AttendanceRepository;
import com.pasa.backend.repository.LearnerRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learners/{learnerId}/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepo;
    private final LearnerRepository learnerRepo;

    public AttendanceController(AttendanceRepository attendanceRepo, LearnerRepository learnerRepo) {
        this.attendanceRepo = attendanceRepo;
        this.learnerRepo = learnerRepo;
    }

    @GetMapping
    public List<Attendance> getAttendance(
            @PathVariable UUID learnerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        if (from != null && to != null) {
            return attendanceRepo.findByLearnerIdAndDateBetweenOrderByDateDesc(learnerId, from, to);
        }
        return attendanceRepo.findByLearnerIdOrderByDateDesc(learnerId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Attendance> recordAttendance(
            @PathVariable UUID learnerId,
            @Valid @RequestBody Attendance attendance,
            Authentication auth
    ) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        if (attendanceRepo.existsByLearnerIdAndDate(learnerId, attendance.getDate())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Attendance already recorded for this date");
        }

        attendance.setLearner(learner);
        attendance.setRecordedBy((UUID) auth.getPrincipal());
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceRepo.save(attendance));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public Attendance updateAttendance(
            @PathVariable UUID learnerId,
            @PathVariable UUID id,
            @Valid @RequestBody Attendance updated,
            Authentication auth
    ) {
        Attendance existing = attendanceRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));

        existing.setStatus(updated.getStatus());
        existing.setNotes(updated.getNotes());
        existing.setRecordedBy((UUID) auth.getPrincipal());
        return attendanceRepo.save(existing);
    }
}
