package com.pasa.backend.controller;

import com.pasa.backend.dto.request.RejectRequest;
import com.pasa.backend.dto.request.SubmitLinkRequest;
import com.pasa.backend.dto.response.LinkRequestResponse;
import com.pasa.backend.service.LinkRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class LinkRequestController {

    private final LinkRequestService linkRequestService;

    public LinkRequestController(LinkRequestService linkRequestService) {
        this.linkRequestService = linkRequestService;
    }

    @GetMapping("/link-requests/mine")
    @PreAuthorize("hasRole('PARENT')")
    public List<LinkRequestResponse> getMyRequests(Authentication auth) {
        UUID parentId = (UUID) auth.getPrincipal();
        return linkRequestService.getMyRequests(parentId);
    }

    @PostMapping("/link-requests")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<LinkRequestResponse> submitRequest(
            @Valid @RequestBody SubmitLinkRequest req,
            Authentication auth
    ) {
        UUID parentId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(linkRequestService.submitRequest(req, parentId));
    }

    @GetMapping("/schools/{schoolId}/link-requests")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<LinkRequestResponse> getSchoolRequests(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) String status
    ) {
        return linkRequestService.getSchoolRequests(schoolId, status);
    }

    @PostMapping("/link-requests/{id}/approve")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public LinkRequestResponse approveRequest(@PathVariable UUID id, Authentication auth) {
        UUID reviewerId = (UUID) auth.getPrincipal();
        return linkRequestService.approveRequest(id, reviewerId);
    }

    @PostMapping("/link-requests/{id}/reject")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public LinkRequestResponse rejectRequest(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest body,
            Authentication auth
    ) {
        UUID reviewerId = (UUID) auth.getPrincipal();
        return linkRequestService.rejectRequest(id, body, reviewerId);
    }
}
