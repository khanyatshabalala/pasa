package com.pasa.backend.admin;

import jakarta.validation.constraints.NotBlank;

public record AssignRoleRequest(@NotBlank String role) {}
