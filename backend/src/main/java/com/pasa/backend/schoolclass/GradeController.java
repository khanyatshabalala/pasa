package com.pasa.backend.schoolclass;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Exposes the grades reference table so the frontend can populate grade selectors
 * without a direct Supabase connection.
 */
@RestController
@RequestMapping("/api/v1/grades")
public class GradeController {

    private final JdbcTemplate jdbc;

    public GradeController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String, Object>> listGrades(@RequestParam(required = false) UUID schoolId) {
        if (schoolId != null) {
            List<Map<String, Object>> schoolGrades = jdbc.queryForList("""
                SELECT g.id, g.label, g.phase
                FROM public.grades g
                JOIN public.schools s ON g.id BETWEEN
                    COALESCE(s.grade_from, CASE s.phase::text
                        WHEN 'primary' THEN 0
                        WHEN 'secondary' THEN 8
                        WHEN 'combined' THEN 0
                        ELSE NULL
                    END)
                    AND COALESCE(s.grade_to, CASE s.phase::text
                        WHEN 'primary' THEN 7
                        WHEN 'secondary' THEN 12
                        WHEN 'combined' THEN 12
                        ELSE NULL
                    END)
                WHERE s.id = ?
                ORDER BY g.id
                """, schoolId);
            if (schoolGrades.isEmpty() && !Boolean.TRUE.equals(jdbc.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM public.schools WHERE id = ?)", Boolean.class, schoolId))) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found");
            }
            return schoolGrades;
        }
        return jdbc.queryForList(
            "SELECT id, label, phase FROM public.grades ORDER BY id"
        );
    }
}
