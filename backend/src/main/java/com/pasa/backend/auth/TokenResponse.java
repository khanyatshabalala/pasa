package com.pasa.backend.auth;

public record TokenResponse(
    String token,
    String userId,
    String role
) {}
