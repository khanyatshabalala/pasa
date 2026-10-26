package com.pasa.backend.controller;

import com.pasa.backend.dto.request.CreateSchoolRequestSubmission;
import com.pasa.backend.dto.request.UpdateSchoolRequestStatus;
import com.pasa.backend.dto.response.SchoolRequestResponse;
import com.pasa.backend.service.SchoolRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * School registration requests.
 * POST is public (landing-page form). Listing and status updates are super-admin only.
 */
@RestController
@RequestMapping("/api/v1/school-requests")
public class SchoolRequestController {

    private final SchoolRequestService service;

    public SchoolRequestController(SchoolRequestService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SchoolRequestResponse> submit(
            @Valid @RequestBody CreateSchoolRequestSubmission req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.submit(req));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<SchoolRequestResponse> list(@RequestParam(required = false) String status) {
        return service.list(status);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public SchoolRequestResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSchoolRequestStatus req,
            Authentication auth) {
        return service.updateStatus(id, req, (UUID) auth.getPrincipal());
    }
}
