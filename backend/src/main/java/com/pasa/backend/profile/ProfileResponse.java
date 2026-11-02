package com.pasa.backend.profile;

public record ProfileResponse(
    String id,
    String fullName,
    String firstName,
    String lastName,
    String phone,
    String avatarUrl,
    String subscriptionTier,
    String city,
    String province,
    /** School of the user's highest-priority staff role; null for parents and super admins. */
    String schoolId
) {}
