package com.pasa.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AssignRoleRequest(@NotBlank String role) {}
