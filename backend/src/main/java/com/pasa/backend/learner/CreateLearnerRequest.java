package com.pasa.backend.learner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateLearnerRequest(
    @NotBlank @Size(max = 50) String firstName,
    @NotBlank @Size(max = 50) String lastName,
    LocalDate dateOfBirth,
    Integer gradeId,
    String learnerNumber,
    String gender,
    /** Optional: the class (e.g. 10A) the learner belongs to at this school. */
    UUID classId
) {}
