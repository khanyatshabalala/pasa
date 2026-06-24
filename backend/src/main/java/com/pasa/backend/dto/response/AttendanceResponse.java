package com.pasa.backend.dto.response;

import com.pasa.backend.domain.enums.AttendanceStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AttendanceResponse(
    UUID id,
    UUID learnerId,
    LocalDate date,
    AttendanceStatus status,
    String notes,
    UUID recordedBy,
    OffsetDateTime recordedAt
) {}
