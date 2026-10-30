package com.pasa.backend.school;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateSchoolRequestStatus(
    @NotBlank
    @Pattern(regexp = "pending|contacted|onboarded|declined",
             message = "status must be one of: pending, contacted, onboarded, declined")
    String status,

    @Size(max = 2000) String adminNotes
) {}
