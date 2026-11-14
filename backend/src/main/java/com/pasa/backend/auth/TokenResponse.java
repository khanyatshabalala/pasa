package com.pasa.backend.auth;

public record TokenResponse(
    String token,
    String userId,
    String role,
    String refreshToken,
    /** School the user works at. Null for parents and super admins. */
    String schoolId
) {
    public TokenResponse(String token, String userId, String role) {
        this(token, userId, role, null, null);
    }
    public TokenResponse(String token, String userId, String role, String refreshToken) {
        this(token, userId, role, refreshToken, null);
    }
}
