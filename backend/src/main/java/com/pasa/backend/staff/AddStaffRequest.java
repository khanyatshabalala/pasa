package com.pasa.backend.staff;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddStaffRequest(
    @NotNull UUID userId,
    String staffNumber,
    String position
) {}
