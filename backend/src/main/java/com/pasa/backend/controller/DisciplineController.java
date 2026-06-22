package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.DisciplineRecord;
import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.repository.DisciplineRepository;
import com.pasa.backend.repository.LearnerRepository;
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
@RequestMapping("/api/v1/learners/{learnerId}/discipline")
public class DisciplineController {

    private final DisciplineRepository disciplineRepo;
    private final LearnerRepository learnerRepo;

    public DisciplineController(DisciplineRepository disciplineRepo, LearnerRepository learnerRepo) {
        this.disciplineRepo = disciplineRepo;
        this.learnerRepo = learnerRepo;
    }

    @GetMapping
    public List<DisciplineRecord> getDiscipline(@PathVariable UUID learnerId) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        return disciplineRepo.findByLearnerIdOrderByDateDesc(learnerId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<DisciplineRecord> createRecord(
            @PathVariable UUID learnerId,
            @Valid @RequestBody DisciplineRecord record,
            Authentication auth
    ) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        record.setLearner(learner);
        record.setRecordedBy((UUID) auth.getPrincipal());
        return ResponseEntity.status(HttpStatus.CREATED).body(disciplineRepo.save(record));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteRecord(@PathVariable UUID learnerId, @PathVariable UUID id) {
        DisciplineRecord record = disciplineRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        disciplineRepo.delete(record);
        return ResponseEntity.noContent().build();
    }
}
