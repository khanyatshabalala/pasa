package com.pasa.backend.dashboard;

import java.util.List;

/**
 * Aggregate payload for the school staff dashboard (SchoolOverview).
 */
public record SchoolDashboardResponse(
    SchoolSummary school,
    int learnerCount,
    TodayAttendance todayAttendance,
    List<DisciplineSummary> recentDiscipline,
    EventSummary nextEvent,
    List<EventSummary> weekEvents,
    int pendingLinkRequests
) {
    public record SchoolSummary(String id, String name, String district, String province) {}

    public record TodayAttendance(int present, int late, int absent, int total, boolean captured) {}

    public record DisciplineSummary(
        String id, String type, String title, String date,
        String learnerFirstName, String learnerLastName
    ) {}

    public record EventSummary(
        String id, String title, String eventDate, String eventTime, String eventType
    ) {}
}
