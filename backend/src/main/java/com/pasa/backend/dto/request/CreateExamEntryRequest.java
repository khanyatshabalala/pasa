package com.pasa.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateExamEntryRequest(
    @NotBlank String subject,
    Integer gradeId,
    @NotNull LocalDate examDate,
    LocalTime startTime,
    LocalTime endTime,
    String venue,
    String notes,
    @NotNull Integer term
) {}
