package com.pasa.backend.schoolclass;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

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
    public List<Map<String, Object>> listGrades() {
        return jdbc.queryForList(
            "SELECT id, label, phase FROM public.grades ORDER BY id"
        );
    }
}
