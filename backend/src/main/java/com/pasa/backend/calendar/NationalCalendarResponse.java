package com.pasa.backend.calendar;

import java.time.LocalDate;
import java.util.UUID;

public record NationalCalendarResponse(
    UUID id,
    String title,
    LocalDate date,
    String type,
    String description
) {}
