package com.pasa.backend.staff;

import java.util.UUID;

public record StaffResponse(
    UUID id,
    UUID userId,
    String staffNumber,
    String position
) {}
