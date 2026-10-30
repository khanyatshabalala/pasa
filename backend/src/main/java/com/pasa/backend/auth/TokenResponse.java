package com.pasa.backend.auth;

public record TokenResponse(
    String token,
    String userId,
    String role,
    String refreshToken
) {
    /** Response without a refresh token (invites, and callers that do not need one). */
    public TokenResponse(String token, String userId, String role) {
        this(token, userId, role, null);
    }
}
