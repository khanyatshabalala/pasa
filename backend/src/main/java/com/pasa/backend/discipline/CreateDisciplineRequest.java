package com.pasa.backend.discipline;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateDisciplineRequest(
    @NotNull DisciplineType type,
    @NotBlank String title,
    String description,
    Integer points,
    @NotNull LocalDate date
) {}
