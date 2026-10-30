package com.pasa.backend.admin;

public record AdminStatsResponse(
    long schools,
    long districts,
    long users,
    long learners,
    long pendingLinkRequests,
    long pendingSchoolRequests
) {}
