package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.AuditLog;
import com.pasa.backend.dto.response.AuditLogResponse;

public final class AuditLogMapper {

    private AuditLogMapper() {}

    public static AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
            log.getId(),
            log.getActorUserId(),
            log.getSchoolId(),
            log.getAction(),
            log.getEntity(),
            log.getEntityId(),
            log.getMetadata(),
            log.getCreatedAt()
        );
    }
}
