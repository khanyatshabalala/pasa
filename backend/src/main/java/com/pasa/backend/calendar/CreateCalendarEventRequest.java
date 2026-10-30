package com.pasa.backend.calendar;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateCalendarEventRequest(
    @NotBlank String title,
    String description,
    @NotNull LocalDate eventDate,
    LocalTime eventTime,
    String eventType,
    UUID classId
) {}
