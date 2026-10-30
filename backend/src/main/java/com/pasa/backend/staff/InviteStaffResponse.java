package com.pasa.backend.staff;

public record InviteStaffResponse(
    String userId,
    String email,
    String role,
    String message
) {}
