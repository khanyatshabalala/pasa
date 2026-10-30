package com.pasa.backend.calendar;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CalendarEventResponse(
    UUID id,
    UUID schoolId,
    String title,
    String description,
    LocalDate eventDate,
    LocalTime eventTime,
    String eventType,
    UUID classId
) {}
