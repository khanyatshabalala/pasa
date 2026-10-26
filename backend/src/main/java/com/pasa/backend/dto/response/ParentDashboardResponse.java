package com.pasa.backend.dto.response;

import java.util.List;
import java.util.Map;

/**
 * Aggregate payload for the parent dashboard (ParentOverview, Option B per-child cards).
 * Each child carries its own today's attendance status and next event so the
 * dashboard can render one self-contained card per child. Alerts stay family-wide
 * because notifications target the parent, not a specific learner.
 */
public record ParentDashboardResponse(
    List<Child> children,
    Map<String, String> todayAttendance,
    int unreadCount,
    List<AlertSummary> recentAlerts
) {
    public record Child(
        String id, String firstName, String lastName,
        String schoolId, String schoolName, Integer gradeId,
        String relationship, Boolean isPrimary,
        String todayStatus,
        NextEvent nextEvent
    ) {}

    public record NextEvent(
        String id, String title, String eventDate, String eventTime,
        String eventType, String schoolName
    ) {}

    public record AlertSummary(
        String id, String title, String body, String category, String createdAt
    ) {}
}
