package com.pasa.backend.dto.response;

public record SchoolRequestResponse(
    String id,
    String schoolName,
    String province,
    String district,
    String contactName,
    String contactRole,
    String contactEmail,
    String contactPhone,
    String message,
    String status,
    String adminNotes,
    String createdAt
) {}
