package com.pasa.backend.admin;

import java.util.List;

public record AdminUserResponse(
    String id,
    String email,
    String fullName,
    List<String> roles,
    String createdAt
) {}
