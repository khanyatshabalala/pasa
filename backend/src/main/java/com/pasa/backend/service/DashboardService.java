package com.pasa.backend.service;

import com.pasa.backend.dto.response.ParentDashboardResponse;
import com.pasa.backend.dto.response.SchoolDashboardResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardService {

    private final JdbcTemplate jdbc;

    public DashboardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── School dashboard ──────────────────────────────────────────────────

    public SchoolDashboardResponse schoolDashboard(UUID schoolId) {
        String today = LocalDate.now().toString();
        String weekEnd = LocalDate.now().plusDays(7).toString();

        Map<String, Object> schoolRow = first(
            "SELECT id, name, district, province FROM public.schools WHERE id = ?", schoolId);
        var school = new SchoolDashboardResponse.SchoolSummary(
            str(schoolRow.get("id")), str(schoolRow.get("name")),
            str(schoolRow.get("district")), str(schoolRow.get("province")));

        int learnerCount = (int) count("SELECT COUNT(*) FROM public.learners WHERE school_id = ?", schoolId);

        // Today's attendance summary across the school's learners
        List<Map<String, Object>> att = jdbc.queryForList("""
            SELECT a.status, COUNT(*) AS n
              FROM public.attendance a
              JOIN public.learners l ON l.id = a.learner_id
             WHERE l.school_id = ? AND a.date = ?::date
             GROUP BY a.status
            """, schoolId, today);
        int present = 0, late = 0, absent = 0, captured = 0;
        for (Map<String, Object> r : att) {
            int n = ((Number) r.get("n")).intValue();
            captured += n;
            switch (str(r.get("status"))) {
                case "present" -> present = n;
                case "late" -> late = n;
                case "absent" -> absent = n;
                default -> { }
            }
        }
        var todayAttendance = new SchoolDashboardResponse.TodayAttendance(
            present, late, absent, learnerCount, captured > 0);

        List<SchoolDashboardResponse.DisciplineSummary> recentDiscipline = jdbc.queryForList("""
            SELECT d.id, d.type, d.title, d.date, l.first_name, l.last_name
              FROM public.discipline_records d
              JOIN public.learners l ON l.id = d.learner_id
             WHERE l.school_id = ?
             ORDER BY d.date DESC
             LIMIT 5
            """, schoolId).stream().map(r -> new SchoolDashboardResponse.DisciplineSummary(
                str(r.get("id")), str(r.get("type")), str(r.get("title")), str(r.get("date")),
                str(r.get("first_name")), str(r.get("last_name")))).toList();

        List<SchoolDashboardResponse.EventSummary> weekEvents = jdbc.queryForList("""
            SELECT id, title, event_date, event_time, event_type
              FROM public.calendar_events
             WHERE school_id = ? AND event_date >= ?::date AND event_date <= ?::date
             ORDER BY event_date, event_time NULLS LAST
             LIMIT 5
            """, schoolId, today, weekEnd).stream().map(DashboardService::event).toList();

        List<SchoolDashboardResponse.EventSummary> nextEvents = jdbc.queryForList("""
            SELECT id, title, event_date, event_time, event_type
              FROM public.calendar_events
             WHERE school_id = ? AND event_date >= ?::date
             ORDER BY event_date, event_time NULLS LAST
             LIMIT 1
            """, schoolId, today).stream().map(DashboardService::event).toList();
        var nextEvent = nextEvents.isEmpty() ? null : nextEvents.get(0);

        int pendingLinks = (int) count(
            "SELECT COUNT(*) FROM public.parent_link_requests WHERE school_id = ? AND status = 'pending'",
            schoolId);

        return new SchoolDashboardResponse(
            school, learnerCount, todayAttendance, recentDiscipline, nextEvent, weekEvents, pendingLinks);
    }

    // ── Parent dashboard ──────────────────────────────────────────────────

    public ParentDashboardResponse parentDashboard(UUID userId) {
        String today = LocalDate.now().toString();

        List<Map<String, Object>> childRows = jdbc.queryForList("""
            SELECT l.id, l.first_name, l.last_name, l.grade_id, l.school_id,
                   s.name AS school_name, pl.relationship, pl.is_primary
              FROM public.parent_links pl
              JOIN public.learners l ON l.id = pl.learner_id
              LEFT JOIN public.schools s ON s.id = l.school_id
             WHERE pl.parent_user_id = ?
             ORDER BY l.first_name
            """, userId);

        List<ParentDashboardResponse.Child> children = childRows.stream()
            .map(r -> new ParentDashboardResponse.Child(
                str(r.get("id")), str(r.get("first_name")), str(r.get("last_name")),
                str(r.get("school_id")), str(r.get("school_name")),
                r.get("grade_id") == null ? null : ((Number) r.get("grade_id")).intValue(),
                str(r.get("relationship")),
                r.get("is_primary") == null ? null : (Boolean) r.get("is_primary")))
            .toList();

        List<Object> learnerIds = childRows.stream().map(r -> r.get("id")).toList();

        Map<String, String> todayAttendance = new java.util.HashMap<>();
        if (!learnerIds.isEmpty()) {
            String placeholders = String.join(",", learnerIds.stream().map(x -> "?").toList());
            Object[] params = new Object[learnerIds.size() + 1];
            for (int i = 0; i < learnerIds.size(); i++) params[i] = learnerIds.get(i);
            params[learnerIds.size()] = today;
            jdbc.queryForList(
                "SELECT learner_id, status FROM public.attendance WHERE learner_id IN (" +
                placeholders + ") AND date = ?::date", params)
                .forEach(r -> todayAttendance.put(str(r.get("learner_id")), str(r.get("status"))));
        }

        int unreadCount = (int) count(
            "SELECT COUNT(*) FROM public.notifications WHERE user_id = ? AND read_at IS NULL", userId);

        List<ParentDashboardResponse.AlertSummary> recentAlerts = jdbc.queryForList("""
            SELECT id, title, body, category, created_at
              FROM public.notifications
             WHERE user_id = ? AND read_at IS NULL
             ORDER BY created_at DESC
             LIMIT 3
            """, userId).stream().map(r -> new ParentDashboardResponse.AlertSummary(
                str(r.get("id")), str(r.get("title")), str(r.get("body")),
                str(r.get("category")), str(r.get("created_at")))).toList();

        ParentDashboardResponse.NextEvent nextEvent = null;
        List<Object> schoolIds = childRows.stream()
            .map(r -> r.get("school_id")).filter(java.util.Objects::nonNull).distinct().toList();
        if (!schoolIds.isEmpty()) {
            String placeholders = String.join(",", schoolIds.stream().map(x -> "?").toList());
            Object[] params = new Object[schoolIds.size() + 1];
            for (int i = 0; i < schoolIds.size(); i++) params[i] = schoolIds.get(i);
            params[schoolIds.size()] = today;
            List<Map<String, Object>> ev = jdbc.queryForList("""
                SELECT ce.id, ce.title, ce.event_date, ce.event_time, ce.event_type, s.name AS school_name
                  FROM public.calendar_events ce
                  LEFT JOIN public.schools s ON s.id = ce.school_id
                 WHERE ce.school_id IN (""" + placeholders + """
                 ) AND ce.event_date >= ?::date
                 ORDER BY ce.event_date, ce.event_time NULLS LAST
                 LIMIT 1
                """, params);
            if (!ev.isEmpty()) {
                Map<String, Object> r = ev.get(0);
                nextEvent = new ParentDashboardResponse.NextEvent(
                    str(r.get("id")), str(r.get("title")), str(r.get("event_date")),
                    str(r.get("event_time")), str(r.get("event_type")), str(r.get("school_name")));
            }
        }

        return new ParentDashboardResponse(children, todayAttendance, unreadCount, nextEvent, recentAlerts);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private static SchoolDashboardResponse.EventSummary event(Map<String, Object> r) {
        return new SchoolDashboardResponse.EventSummary(
            str(r.get("id")), str(r.get("title")), str(r.get("event_date")),
            str(r.get("event_time")), str(r.get("event_type")));
    }

    private Map<String, Object> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, args);
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    private long count(String sql, Object... args) {
        Long n = jdbc.queryForObject(sql, Long.class, args);
        return n == null ? 0L : n;
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
