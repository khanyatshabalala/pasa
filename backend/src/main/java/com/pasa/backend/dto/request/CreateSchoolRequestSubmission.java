package com.pasa.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public submission from the landing-page "register your school" form.
 * Named to avoid clashing with {@code CreateSchoolRequest} (the admin school-create DTO).
 */
public record CreateSchoolRequestSubmission(
    @NotBlank @Size(max = 200) String schoolName,
    @NotBlank @Size(max = 100) String province,
    @NotBlank @Size(max = 200) String district,
    @NotBlank @Size(max = 200) String contactName,
    @NotBlank @Size(max = 50)  String contactRole,
    @NotBlank @Email @Size(max = 200) String contactEmail,
    @Size(max = 50)   String contactPhone,
    @Size(max = 2000) String message
) {}
