package com.pasa.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateClassRequest(
    @NotBlank String name,
    @NotNull Integer gradeId,
    UUID teacherUserId,
    Integer academicYear
) {}
