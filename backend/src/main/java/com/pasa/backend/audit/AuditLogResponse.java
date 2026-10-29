package com.pasa.backend.audit;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(
    UUID id,
    UUID actorUserId,
    UUID schoolId,
    String action,
    String entity,
    UUID entityId,
    Map<String, Object> metadata,
    OffsetDateTime createdAt
) {}
