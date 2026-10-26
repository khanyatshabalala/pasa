package com.pasa.backend.controller;

import com.pasa.backend.dto.request.RecordMarkRequest;
import com.pasa.backend.dto.response.MarkResponse;
import com.pasa.backend.service.MarkService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learners/{learnerId}/marks")
public class MarksController {

    private final MarkService markService;

    public MarksController(MarkService markService) {
        this.markService = markService;
    }

    @GetMapping
    public List<MarkResponse> getMarks(
            @PathVariable UUID learnerId,
            @RequestParam(required = false) Integer term,
            Authentication auth
    ) {
        return markService.getMarks(learnerId, term, (UUID) auth.getPrincipal());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<MarkResponse> recordMark(
            @PathVariable UUID learnerId,
            @Valid @RequestBody RecordMarkRequest req,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(markService.recordMark(learnerId, req, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public MarkResponse updateMark(
            @PathVariable UUID learnerId,
            @PathVariable UUID id,
            @Valid @RequestBody RecordMarkRequest req,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return markService.updateMark(id, req, userId);
    }
}
