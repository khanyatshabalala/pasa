package com.pasa.backend.dto.response;

public record AdminStatsResponse(
    long schools,
    long districts,
    long users,
    long learners,
    long pendingLinkRequests,
    long pendingSchoolRequests
) {}
