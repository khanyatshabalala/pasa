package com.pasa.backend.school;

import com.pasa.backend.domain.enums.SchoolPhase;
import com.pasa.backend.domain.enums.SchoolType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSchoolRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 20) String emisNumber,
    @NotBlank String district,
    @NotBlank String province,
    @NotNull SchoolPhase phase,
    @NotNull SchoolType schoolType,
    String city,
    @Email String email,
    String phone,
    UUID districtId,
    @Min(0) @Max(12) Integer gradeFrom,
    @Min(0) @Max(12) Integer gradeTo,
    LocalDate applicationOpen,
    LocalDate applicationClose,
    @Size(max = 2000) String admissionRequirements,
    @Size(max = 500) String applicationContact
) {}
