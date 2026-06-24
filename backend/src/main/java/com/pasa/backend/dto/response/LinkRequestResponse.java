package com.pasa.backend.dto.response;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LinkRequestResponse(
    UUID id,
    UUID parentUserId,
    UUID schoolId,
    String schoolName,
    String learnerNumber,
    String firstName,
    String lastName,
    String relationship,
    String status,
    OffsetDateTime createdAt
) {}
