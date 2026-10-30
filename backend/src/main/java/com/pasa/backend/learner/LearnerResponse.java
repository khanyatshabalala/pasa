package com.pasa.backend.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record LearnerResponse(
    UUID id,
    String firstName,
    String lastName,
    LocalDate dateOfBirth,
    Integer gradeId,
    String learnerNumber,
    String gender,
    UUID schoolId,
    String schoolName
) {}
