package com.pasa.backend.controller;

import com.pasa.backend.dto.request.RecordAttendanceRequest;
import com.pasa.backend.dto.response.AttendanceResponse;
import com.pasa.backend.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learners/{learnerId}/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public List<AttendanceResponse> getAttendance(
            @PathVariable UUID learnerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return attendanceService.getAttendance(learnerId, from, to);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AttendanceResponse> recordAttendance(
            @PathVariable UUID learnerId,
            @Valid @RequestBody RecordAttendanceRequest req,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.recordAttendance(learnerId, req, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public AttendanceResponse updateAttendance(
            @PathVariable UUID learnerId,
            @PathVariable UUID id,
            @Valid @RequestBody RecordAttendanceRequest req,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return attendanceService.updateAttendance(id, req, userId);
    }
}
