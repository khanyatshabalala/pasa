package com.pasa.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record RecordMarkRequest(
    @NotNull UUID subjectId,
    @NotBlank String assessmentName,
    @NotNull Integer term,
    @NotNull BigDecimal score,
    BigDecimal maxScore
) {}
