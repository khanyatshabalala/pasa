package com.pasa.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDistrictRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Size(max = 50) String province
) {}
