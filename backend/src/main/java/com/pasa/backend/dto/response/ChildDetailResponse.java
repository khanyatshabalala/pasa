package com.pasa.backend.dto.response;

import java.util.List;

/**
 * Parent-facing aggregate for a single linked child: profile + recent attendance,
 * discipline, report cards, and upcoming events. Served only to a parent linked to
 * the learner (ownership enforced in the service).
 */
public record ChildDetailResponse(
    Child child,
    AttendanceSummary attendanceSummary,
    List<AttendanceRow> recentAttendance,
    List<DisciplineRow> discipline,
    List<ReportCardRow> reportCards,
    List<EventRow> upcomingEvents
) {
    public record Child(
        String id, String firstName, String lastName,
        Integer gradeId, String learnerNumber,
        String schoolId, String schoolName,
        String todayStatus
    ) {}

    public record AttendanceSummary(int present, int late, int absent, int total, Integer ratePercent) {}

    public record AttendanceRow(String id, String date, String status, String notes) {}

    public record DisciplineRow(String id, String date, String type, String title, Integer points) {}

    public record ReportCardRow(String id, Integer academicYear, Integer term, String fileName, String uploadedAt) {}

    public record EventRow(String id, String title, String eventDate, String eventTime, String eventType) {}
}
