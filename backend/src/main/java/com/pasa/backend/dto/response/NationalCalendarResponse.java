package com.pasa.backend.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record NationalCalendarResponse(
    UUID id,
    String title,
    LocalDate date,
    String type,
    String description
) {}
