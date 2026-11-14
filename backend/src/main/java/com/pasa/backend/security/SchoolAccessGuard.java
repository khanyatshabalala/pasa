package com.pasa.backend.security;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class SchoolAccessGuard {

    private final JdbcTemplate jdbc;

    public SchoolAccessGuard(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void assertCanAccessSchool(UUID schoolId, UUID userId) {
        Boolean allowed = jdbc.queryForObject("""
            SELECT EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = ? AND school_id = ?
                  AND role::text IN ('teacher', 'principal', 'school_admin')
            ) OR EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = ? AND role::text = 'super_admin'
            )
            """, Boolean.class, userId, schoolId, userId);
        if (!Boolean.TRUE.equals(allowed)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access this school");
        }
    }

    public void assertCanManageSchool(UUID schoolId, UUID userId) {
        Boolean allowed = jdbc.queryForObject("""
            SELECT EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = ? AND school_id = ?
                  AND role::text IN ('principal', 'school_admin')
            ) OR EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = ? AND role::text = 'super_admin'
            )
            """, Boolean.class, userId, schoolId, userId);
        if (!Boolean.TRUE.equals(allowed)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to manage this school");
        }
    }
}
