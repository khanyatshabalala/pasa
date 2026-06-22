package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.Mark;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.MarkRepository;
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
@RequestMapping("/api/v1/learners/{learnerId}/marks")
public class MarksController {

    private final MarkRepository markRepo;
    private final LearnerRepository learnerRepo;

    public MarksController(MarkRepository markRepo, LearnerRepository learnerRepo) {
        this.markRepo = markRepo;
        this.learnerRepo = learnerRepo;
    }

    @GetMapping
    public List<Mark> getMarks(
            @PathVariable UUID learnerId,
            @RequestParam(required = false) Integer term
    ) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        if (term != null) return markRepo.findByLearnerIdAndTerm(learnerId, term);
        return markRepo.findByLearnerIdOrderByRecordedAtDesc(learnerId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Mark> recordMark(
            @PathVariable UUID learnerId,
            @Valid @RequestBody Mark mark,
            Authentication auth
    ) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        mark.setLearner(learner);
        mark.setRecordedBy((UUID) auth.getPrincipal());
        return ResponseEntity.status(HttpStatus.CREATED).body(markRepo.save(mark));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public Mark updateMark(
            @PathVariable UUID learnerId,
            @PathVariable UUID id,
            @Valid @RequestBody Mark updated,
            Authentication auth
    ) {
        Mark existing = markRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mark not found"));

        existing.setScore(updated.getScore());
        existing.setMaxScore(updated.getMaxScore());
        existing.setClassAverage(updated.getClassAverage());
        existing.setAssessmentName(updated.getAssessmentName());
        existing.setTerm(updated.getTerm());
        existing.setRecordedBy((UUID) auth.getPrincipal());
        return markRepo.save(existing);
    }
}
