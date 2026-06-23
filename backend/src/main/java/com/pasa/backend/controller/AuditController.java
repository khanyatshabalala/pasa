package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.AuditLog;
import com.pasa.backend.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/audit")
public class AuditController {

    private final AuditLogRepository auditRepo;

    public AuditController(AuditLogRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public Page<AuditLog> getAuditLog(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        if (action != null && !action.isBlank()) {
            return auditRepo.findBySchoolIdAndActionOrderByCreatedAtDesc(schoolId, action, pageable);
        }
        return auditRepo.findBySchoolIdOrderByCreatedAtDesc(schoolId, pageable);
    }
}
