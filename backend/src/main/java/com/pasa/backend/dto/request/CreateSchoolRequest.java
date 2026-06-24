package com.pasa.backend.dto.request;

import com.pasa.backend.domain.enums.SchoolPhase;
import com.pasa.backend.domain.enums.SchoolType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSchoolRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 20) String emisNumber,
    @NotBlank String district,
    @NotBlank String province,
    @NotNull SchoolPhase phase,
    @NotNull SchoolType schoolType,
    String city,
    @Email String email,
    String phone
) {}
