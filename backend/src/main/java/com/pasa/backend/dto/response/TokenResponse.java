package com.pasa.backend.dto.response;

public record TokenResponse(
    String token,
    String userId,
    String role
) {}
