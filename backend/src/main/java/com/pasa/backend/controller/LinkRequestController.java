package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.LinkRequest;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.LinkRequestRepository;
import com.pasa.backend.repository.SchoolRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class LinkRequestController {

    private final LinkRequestRepository linkRequestRepo;
    private final SchoolRepository schoolRepo;

    public LinkRequestController(LinkRequestRepository linkRequestRepo, SchoolRepository schoolRepo) {
        this.linkRequestRepo = linkRequestRepo;
        this.schoolRepo = schoolRepo;
    }

    // Parent: view own requests
    @GetMapping("/link-requests/mine")
    @PreAuthorize("hasRole('PARENT')")
    public List<LinkRequest> getMyRequests(Authentication auth) {
        return linkRequestRepo.findByParentUserId((UUID) auth.getPrincipal());
    }

    // Parent: submit a new request
    @PostMapping("/link-requests")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<LinkRequest> submitRequest(
            @Valid @RequestBody LinkRequestBody req,
            Authentication auth
    ) {
        School school = schoolRepo.findById(req.schoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));

        LinkRequest request = new LinkRequest();
        request.setParentUserId((UUID) auth.getPrincipal());
        request.setSchool(school);
        request.setLearnerNumber(req.learnerNumber());
        request.setFirstName(req.firstName());
        request.setLastName(req.lastName());
        request.setRelationship(req.relationship() != null ? req.relationship() : "parent");
        request.setStatus("pending");

        return ResponseEntity.status(HttpStatus.CREATED).body(linkRequestRepo.save(request));
    }

    // School staff: view requests for their school
    @GetMapping("/schools/{schoolId}/link-requests")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<LinkRequest> getSchoolRequests(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) String status
    ) {
        if (status != null) {
            return linkRequestRepo.findBySchoolIdAndStatus(schoolId, status);
        }
        return linkRequestRepo.findBySchoolIdOrderByCreatedAtDesc(schoolId);
    }

    // School staff: approve a request
    @PostMapping("/link-requests/{id}/approve")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public LinkRequest approveRequest(@PathVariable UUID id, Authentication auth) {
        LinkRequest request = linkRequestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"pending".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already processed");
        }
        request.setStatus("approved");
        request.setReviewedBy((UUID) auth.getPrincipal());
        request.setReviewedAt(OffsetDateTime.now());
        return linkRequestRepo.save(request);
    }

    // School staff: reject a request
    @PostMapping("/link-requests/{id}/reject")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public LinkRequest rejectRequest(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectBody body,
            Authentication auth
    ) {
        LinkRequest request = linkRequestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"pending".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already processed");
        }
        request.setStatus("rejected");
        request.setReviewedBy((UUID) auth.getPrincipal());
        request.setReviewedAt(OffsetDateTime.now());
        if (body != null) request.setRejectionReason(body.reason());
        return linkRequestRepo.save(request);
    }

    public record LinkRequestBody(
        UUID schoolId,
        @NotBlank String learnerNumber,
        @NotBlank String firstName,
        @NotBlank String lastName,
        String relationship
    ) {}

    public record RejectBody(String reason) {}
}
