package com.pasa.backend.linkrequest;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LinkRequestResponse(
    UUID id,
    UUID parentUserId,
    String parentName,
    UUID schoolId,
    String schoolName,
    String learnerNumber,
    String firstName,
    String lastName,
    Integer gradeId,
    UUID classId,
    String relationship,
    String status,
    OffsetDateTime createdAt,
    /** Reason given when a school rejects the request; null otherwise. */
    String rejectionReason,
    OffsetDateTime updatedAt,
    OffsetDateTime withdrawnAt
) {}
