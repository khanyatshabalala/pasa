package com.pasa.backend.dto.response;

import java.util.UUID;

public record StaffResponse(
    UUID id,
    UUID userId,
    String staffNumber,
    String position
) {}
