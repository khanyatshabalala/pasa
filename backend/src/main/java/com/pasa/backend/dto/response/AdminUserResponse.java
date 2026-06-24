package com.pasa.backend.dto.response;

import java.util.List;

public record AdminUserResponse(
    String id,
    String email,
    String fullName,
    List<String> roles,
    String createdAt
) {}
