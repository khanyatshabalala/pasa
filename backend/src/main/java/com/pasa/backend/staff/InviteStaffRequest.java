package com.pasa.backend.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InviteStaffRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(max = 50) String firstName,
    @NotBlank @Size(max = 50) String lastName,
    @NotBlank String role,  // teacher, principal, school_admin
    String staffNumber,
    String position
) {}
