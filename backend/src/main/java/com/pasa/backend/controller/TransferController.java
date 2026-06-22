package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.domain.entity.Transfer;
import com.pasa.backend.domain.enums.TransferStatus;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.repository.TransferRepository;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/transfers")
public class TransferController {

    private final TransferRepository transferRepo;
    private final LearnerRepository learnerRepo;
    private final SchoolRepository schoolRepo;

    public TransferController(
            TransferRepository transferRepo,
            LearnerRepository learnerRepo,
            SchoolRepository schoolRepo
    ) {
        this.transferRepo = transferRepo;
        this.learnerRepo = learnerRepo;
        this.schoolRepo = schoolRepo;
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<Transfer> getBySchool(@PathVariable UUID schoolId) {
        return transferRepo.findByFromSchoolIdOrToSchoolId(schoolId, schoolId);
    }

    @GetMapping("/learner/{learnerId}")
    public List<Transfer> getByLearner(@PathVariable UUID learnerId) {
        return transferRepo.findByLearnerId(learnerId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PARENT','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Transfer> requestTransfer(
            @Valid @RequestBody TransferRequest req,
            Authentication auth
    ) {
        Learner learner = learnerRepo.findById(req.learnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        School fromSchool = schoolRepo.findById(req.fromSchoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "From school not found"));
        School toSchool = schoolRepo.findById(req.toSchoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "To school not found"));

        Transfer transfer = Transfer.create(
                learner, fromSchool, toSchool,
                req.reason(), TransferStatus.pending, (UUID) auth.getPrincipal()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(transferRepo.save(transfer));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public Transfer updateStatus(
            @PathVariable UUID id,
            @RequestParam TransferStatus status,
            Authentication auth
    ) {
        Transfer transfer = transferRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer not found"));

        transfer.setStatus(status);
        transfer.setApprovedBy((UUID) auth.getPrincipal());
        transfer.setResolvedAt(OffsetDateTime.now());
        return transferRepo.save(transfer);
    }

    public record TransferRequest(UUID learnerId, UUID fromSchoolId, UUID toSchoolId, String reason) {}
}
