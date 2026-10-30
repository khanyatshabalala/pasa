package com.pasa.backend.calendar;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ExamEntryResponse(
    UUID id,
    String subject,
    Integer gradeId,
    LocalDate examDate,
    LocalTime startTime,
    LocalTime endTime,
    String venue,
    String notes,
    Integer term
) {}
