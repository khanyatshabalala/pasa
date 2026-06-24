package com.pasa.backend.dto.response;

import com.pasa.backend.domain.enums.TransferStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TransferResponse(
    UUID id,
    UUID learnerId,
    UUID fromSchoolId,
    UUID toSchoolId,
    String reason,
    TransferStatus status,
    OffsetDateTime requestedAt,
    OffsetDateTime resolvedAt
) {}
