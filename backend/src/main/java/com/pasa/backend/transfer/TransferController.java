package com.pasa.backend.transfer;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<TransferResponse> getBySchool(@PathVariable UUID schoolId) {
        return transferService.getBySchool(schoolId);
    }

    @GetMapping("/learner/{learnerId}")
    public List<TransferResponse> getByLearner(@PathVariable UUID learnerId) {
        return transferService.getByLearner(learnerId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PARENT','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<TransferResponse> requestTransfer(
            @Valid @RequestBody CreateTransferRequest req,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(transferService.requestTransfer(req, userId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public TransferResponse updateStatus(
            @PathVariable UUID id,
            @RequestParam TransferStatus status,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return transferService.updateStatus(id, status, userId);
    }
}
