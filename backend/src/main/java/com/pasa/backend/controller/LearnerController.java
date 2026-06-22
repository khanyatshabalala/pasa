package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.SchoolRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class LearnerController {

    private final LearnerRepository learnerRepo;
    private final SchoolRepository schoolRepo;

    public LearnerController(LearnerRepository learnerRepo, SchoolRepository schoolRepo) {
        this.learnerRepo = learnerRepo;
        this.schoolRepo = schoolRepo;
    }

    // Parents: get their own children
    @GetMapping("/children")
    @PreAuthorize("hasRole('PARENT')")
    public List<Learner> getMyChildren(Authentication auth) {
        UUID parentId = (UUID) auth.getPrincipal();
        return learnerRepo.findByParentUserId(parentId);
    }

    // Staff: get learners at their school
    @GetMapping("/schools/{schoolId}/learners")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<Learner> getLearnersBySchool(@PathVariable UUID schoolId) {
        if (!schoolRepo.existsById(schoolId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found");
        }
        return learnerRepo.findBySchoolId(schoolId);
    }

    @GetMapping("/learners/{id}")
    public Learner getLearner(@PathVariable UUID id) {
        return learnerRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
    }

    @PostMapping("/schools/{schoolId}/learners")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Learner> createLearner(
            @PathVariable UUID schoolId,
            @Valid @RequestBody Learner learner
    ) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        learner.setSchool(school);
        return ResponseEntity.status(HttpStatus.CREATED).body(learnerRepo.save(learner));
    }

    @PutMapping("/learners/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public Learner updateLearner(@PathVariable UUID id, @Valid @RequestBody Learner updated) {
        Learner existing = learnerRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        updated.setId(existing.getId());
        updated.setSchool(existing.getSchool());
        updated.setCreatedAt(existing.getCreatedAt());
        return learnerRepo.save(updated);
    }
}
