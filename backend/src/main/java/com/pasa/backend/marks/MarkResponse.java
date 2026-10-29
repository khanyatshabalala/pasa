package com.pasa.backend.marks;

import java.math.BigDecimal;
import java.util.UUID;

public record MarkResponse(
    UUID id,
    UUID learnerId,
    UUID subjectId,
    String assessmentName,
    Integer term,
    BigDecimal score,
    BigDecimal maxScore,
    BigDecimal classAverage
) {}
