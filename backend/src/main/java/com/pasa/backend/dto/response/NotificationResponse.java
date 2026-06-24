package com.pasa.backend.dto.response;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String title,
    String body,
    String category,
    String link,
    OffsetDateTime readAt,
    OffsetDateTime createdAt
) {}
