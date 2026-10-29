package com.pasa.backend.transfer;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateTransferRequest(
    @NotNull UUID learnerId,
    @NotNull UUID fromSchoolId,
    @NotNull UUID toSchoolId,
    String reason
) {}
