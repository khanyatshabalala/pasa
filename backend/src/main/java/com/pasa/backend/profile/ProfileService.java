package com.pasa.backend.profile;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ProfileService {

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder encoder;

    public ProfileService(JdbcTemplate jdbc, BCryptPasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.encoder = encoder;
    }

    public ProfileResponse getProfile(UUID userId) {
        var rows = jdbc.queryForList(
            "SELECT id, full_name, first_name, last_name, phone, avatar_url, subscription_tier, city, province FROM public.profiles WHERE id = ?",
            userId
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
        }
        var r = rows.get(0);
        return new ProfileResponse(
            r.get("id").toString(),
            (String) r.get("full_name"),
            (String) r.get("first_name"),
            (String) r.get("last_name"),
            (String) r.get("phone"),
            (String) r.get("avatar_url"),
            r.get("subscription_tier") != null ? r.get("subscription_tier").toString() : "free",
            (String) r.get("city"),
            (String) r.get("province"),
            primarySchoolId(userId)
        );
    }

    /**
     * The school the user works at, chosen by the same role priority sign-in uses
     * (principal, then school_admin, then teacher). Parents and super admins have none.
     */
    private String primarySchoolId(UUID userId) {
        var rows = jdbc.queryForList("""
            SELECT school_id FROM public.user_roles
            WHERE user_id = ? AND school_id IS NOT NULL
              AND role::text IN ('principal', 'school_admin', 'teacher')
            ORDER BY CASE role::text
                       WHEN 'principal'    THEN 1
                       WHEN 'school_admin' THEN 2
                       ELSE 3
                     END,
                     created_at ASC
            LIMIT 1
            """, userId);
        return rows.isEmpty() ? null : rows.get(0).get("school_id").toString();
    }

    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        String fullName = null;
        if (req.firstName() != null || req.lastName() != null) {
            fullName = ((req.firstName() != null ? req.firstName() : "") + " " +
                       (req.lastName() != null ? req.lastName() : "")).trim();
        }

        jdbc.update("""
            UPDATE public.profiles SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                full_name = COALESCE(?, full_name),
                phone = COALESCE(?, phone),
                city = COALESCE(?, city),
                province = COALESCE(?, province),
                updated_at = now()
            WHERE id = ?
            """,
            req.firstName(), req.lastName(), fullName,
            req.phone(), req.city(), req.province(), userId
        );

        return getProfile(userId);
    }

    public void changePassword(UUID userId, ChangePasswordRequest req) {
        var rows = jdbc.queryForList(
            "SELECT encrypted_password FROM auth.users WHERE id = ?", userId
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        String hash = (String) rows.get(0).get("encrypted_password");
        if (!encoder.matches(req.currentPassword(), hash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }
        String newHash = encoder.encode(req.newPassword());
        jdbc.update("UPDATE auth.users SET encrypted_password = ?, updated_at = now() WHERE id = ?", newHash, userId);
    }
}
