package com.pasa.backend.learner;

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
public class LearnerController {

    private final LearnerService learnerService;

    public LearnerController(LearnerService learnerService) {
        this.learnerService = learnerService;
    }

    @GetMapping("/children")
    @PreAuthorize("hasRole('PARENT')")
    public List<LearnerResponse> getMyChildren(Authentication auth) {
        UUID parentId = (UUID) auth.getPrincipal();
        return learnerService.getMyChildren(parentId);
    }

    @GetMapping("/schools/{schoolId}/learners")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<LearnerResponse> getLearnersBySchool(@PathVariable UUID schoolId) {
        return learnerService.getLearnersBySchool(schoolId);
    }

    @GetMapping("/learners/{id}")
    public LearnerResponse getLearner(@PathVariable UUID id, Authentication auth) {
        return learnerService.getLearner(id, (UUID) auth.getPrincipal());
    }

    @PostMapping("/schools/{schoolId}/learners")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<LearnerResponse> createLearner(
            @PathVariable UUID schoolId,
            @Valid @RequestBody CreateLearnerRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(learnerService.createLearner(schoolId, req));
    }

    @PutMapping("/learners/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public LearnerResponse updateLearner(@PathVariable UUID id, @Valid @RequestBody CreateLearnerRequest req) {
        return learnerService.updateLearner(id, req);
    }
}
