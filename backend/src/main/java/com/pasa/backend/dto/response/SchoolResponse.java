package com.pasa.backend.dto.response;

import com.pasa.backend.domain.enums.SchoolPhase;
import com.pasa.backend.domain.enums.SchoolType;

import java.math.BigDecimal;
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
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
