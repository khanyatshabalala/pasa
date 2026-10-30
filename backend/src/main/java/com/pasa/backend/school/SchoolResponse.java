package com.pasa.backend.school;

import com.pasa.backend.domain.enums.SchoolPhase;
import com.pasa.backend.domain.enums.SchoolType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SchoolResponse(
    UUID id,
    String name,
    String emisNumber,
    String district,
    String province,
    SchoolPhase phase,
    SchoolType schoolType,
    String address,
    String city,
    String postalCode,
    String phone,
    String email,
    String website,
    String principalName,
    Integer establishedYear,
    Integer learnerCount,
    BigDecimal feesAnnual,
    String logoUrl,
    String motto,
    String description,
    UUID districtId,
    Integer gradeFrom,
    Integer gradeTo,
    LocalDate applicationOpen,
    LocalDate applicationClose,
    String admissionRequirements,
    String applicationContact,
    BigDecimal performanceAvg,
    Integer performanceRankDistrict,
    Integer performanceRankProvince,
    Integer performanceRankNational,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
