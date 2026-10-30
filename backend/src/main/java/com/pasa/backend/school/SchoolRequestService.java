package com.pasa.backend.school;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SchoolRequestService {

    private final JdbcTemplate jdbc;

    public SchoolRequestService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public SchoolRequestResponse submit(CreateSchoolRequestSubmission req) {
        // Dedup: reject when a still-pending request already exists for the same
        // school + contact email (case-insensitive). Prevents accidental double-submits
        // and casual spam on this public endpoint.
        Boolean duplicate = jdbc.queryForObject("""
            SELECT EXISTS (
              SELECT 1 FROM public.school_requests
              WHERE status = 'pending'
                AND lower(school_name) = lower(?)
                AND lower(contact_email) = lower(?)
            )
            """, Boolean.class, req.schoolName(), req.contactEmail());
        if (Boolean.TRUE.equals(duplicate)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "A request for this school from this email is already awaiting review.");
        }

        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO public.school_requests
                (id, school_name, province, district, contact_name, contact_role,
                 contact_email, contact_phone, message, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            """,
            id, req.schoolName(), req.province(), req.district(), req.contactName(),
            req.contactRole(), req.contactEmail(),
            blankToNull(req.contactPhone()), blankToNull(req.message()));
        return getById(id);
    }

    public List<SchoolRequestResponse> list(String status) {
        String sql;
        Object[] params;
        if (status != null && !status.isBlank()) {
            sql = "SELECT * FROM public.school_requests WHERE status = ?::school_request_status ORDER BY created_at DESC";
            params = new Object[]{status};
        } else {
            sql = "SELECT * FROM public.school_requests ORDER BY created_at DESC";
            params = new Object[]{};
        }
        return jdbc.queryForList(sql, params).stream().map(SchoolRequestService::map).toList();
    }

    public SchoolRequestResponse updateStatus(UUID id, UpdateSchoolRequestStatus req, UUID reviewerId) {
        // Preserve existing notes when adminNotes is omitted (null); only overwrite when
        // a value is actually provided. Record which admin reviewed it.
        int rows = jdbc.update("""
            UPDATE public.school_requests
               SET status = ?::school_request_status,
                   admin_notes = COALESCE(?, admin_notes),
                   reviewed_by = ?,
                   reviewed_at = now()
             WHERE id = ?
            """,
            req.status(), blankToNull(req.adminNotes()), reviewerId, id);
        if (rows == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School request not found");
        }
        return getById(id);
    }

    private SchoolRequestResponse getById(UUID id) {
        List<Map<String, Object>> rows =
            jdbc.queryForList("SELECT * FROM public.school_requests WHERE id = ?", id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School request not found");
        }
        return map(rows.get(0));
    }

    private static SchoolRequestResponse map(Map<String, Object> row) {
        return new SchoolRequestResponse(
            str(row.get("id")),
            str(row.get("school_name")),
            str(row.get("province")),
            str(row.get("district")),
            str(row.get("contact_name")),
            str(row.get("contact_role")),
            str(row.get("contact_email")),
            str(row.get("contact_phone")),
            str(row.get("message")),
            str(row.get("status")),
            str(row.get("admin_notes")),
            str(row.get("created_at"))
        );
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
