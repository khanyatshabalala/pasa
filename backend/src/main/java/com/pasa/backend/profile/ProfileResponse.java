package com.pasa.backend.dto.response;

public record ProfileResponse(
    String id,
    String fullName,
    String firstName,
    String lastName,
    String phone,
    String avatarUrl,
    String subscriptionTier,
    String city,
    String province
) {}
