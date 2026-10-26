package com.pasa.backend.security;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Central authorization for learner-scoped reads. The backend connects with a
 * privileged database role that bypasses row-level security, so ownership MUST be
 * enforced in application code here — not relied upon at the DB layer.
 *
 * A user may read a learner's records when they are:
 *   - a parent linked to the learner (public.parent_links), or
 *   - a staff member (any role) at the learner's school (public.user_roles), or
 *   - a super admin.
 */
@Component
public class LearnerAccessGuard {

    private final JdbcTemplate jdbc;

    public LearnerAccessGuard(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** True if the user may read the learner's records. */
    public boolean canAccessLearner(UUID learnerId, UUID userId) {
        if (learnerId == null || userId == null) return false;
        Boolean allowed = jdbc.queryForObject(
            """
            SELECT
              EXISTS (
                SELECT 1 FROM public.parent_links pl
                WHERE pl.learner_id = ? AND pl.parent_user_id = ?
              )
              OR EXISTS (
                SELECT 1 FROM public.learners l
                JOIN public.user_roles ur ON ur.school_id = l.school_id
                WHERE l.id = ? AND ur.user_id = ?
              )
              OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = ? AND ur.role = 'super_admin'
              )
            """,
            Boolean.class,
            learnerId, userId, learnerId, userId, userId
        );
        return Boolean.TRUE.equals(allowed);
    }

    /** True only if the user is a parent linked to the learner. */
    public boolean isParentOf(UUID learnerId, UUID userId) {
        if (learnerId == null || userId == null) return false;
        Boolean linked = jdbc.queryForObject(
            """
            SELECT EXISTS (
              SELECT 1 FROM public.parent_links
              WHERE learner_id = ? AND parent_user_id = ?
            )
            """,
            Boolean.class, learnerId, userId);
        return Boolean.TRUE.equals(linked);
    }

    /** Throws 403 unless the user may read the learner's records. */
    public void assertCanAccessLearner(UUID learnerId, UUID userId) {
        if (!canAccessLearner(learnerId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access this learner");
        }
    }

    /** Throws 403 unless the user is a parent linked to the learner. */
    public void assertParentOf(UUID learnerId, UUID userId) {
        if (!isParentOf(learnerId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view this learner");
        }
    }
}
