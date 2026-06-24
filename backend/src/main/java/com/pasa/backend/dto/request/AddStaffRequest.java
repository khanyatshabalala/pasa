package com.pasa.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddStaffRequest(
    @NotNull UUID userId,
    String staffNumber,
    String position
) {}
