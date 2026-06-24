package com.pasa.backend.dto.response;

public record InviteStaffResponse(
    String userId,
    String email,
    String role,
    String message
) {}
