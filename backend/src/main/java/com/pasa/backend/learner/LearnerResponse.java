package com.pasa.backend.learner;

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
    String schoolName,
    /** UUID of the class the learner belongs to (e.g. 10A). Null if unassigned. */
    UUID classId,
    /** Name of the class (e.g. "10A"). Null if unassigned. Used for display: "Grade 10A". */
    String className
) {}
