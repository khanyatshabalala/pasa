package com.pasa.backend.schoolclass;

import java.util.UUID;

public record ClassResponse(
    UUID id,
    String name,
    Integer gradeId,
    UUID teacherUserId,
    Integer academicYear
) {}
