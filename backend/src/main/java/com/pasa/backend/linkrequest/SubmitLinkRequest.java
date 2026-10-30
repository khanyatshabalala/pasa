package com.pasa.backend.linkrequest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SubmitLinkRequest(
    @NotNull UUID schoolId,
    @NotBlank String learnerNumber,
    @NotBlank String firstName,
    @NotBlank String lastName,
    String relationship
) {}
