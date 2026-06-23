package com.pasa.backend.service;

import com.pasa.backend.domain.entity.AuditLog;
import com.pasa.backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Call this from any controller/service to record an audit event.
 * Runs synchronously — for high-throughput use an async queue later.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditRepo;

    public AuditService(AuditLogRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    public void log(UUID actorUserId, UUID schoolId, String action, String entity, UUID entityId) {
        auditRepo.save(AuditLog.create(actorUserId, schoolId, action, entity, entityId, null));
    }

    public void log(UUID actorUserId, UUID schoolId, String action, String entity, UUID entityId, Map<String, Object> metadata) {
        auditRepo.save(AuditLog.create(actorUserId, schoolId, action, entity, entityId, metadata));
    }
}
