package com.pasa.backend.discipline;

import java.time.LocalDate;
import java.util.UUID;

public record DisciplineResponse(
    UUID id,
    UUID learnerId,
    DisciplineType type,
    String title,
    String description,
    Integer points,
    LocalDate date
) {}
