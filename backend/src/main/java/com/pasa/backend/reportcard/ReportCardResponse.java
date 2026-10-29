package com.pasa.backend.reportcard;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReportCardResponse(
    UUID id,
    UUID learnerId,
    UUID schoolId,
    Integer academicYear,
    Integer term,
    String fileName,
    UUID uploadedBy,
    String uploadedByName,
    OffsetDateTime uploadedAt,
    String notes,
    String learnerFirstName,
    String learnerLastName
) {}
