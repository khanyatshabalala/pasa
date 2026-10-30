package com.pasa.backend.auth;

import com.pasa.backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final Set<String> STAFF_ROLES = Set.of("teacher", "principal", "school_admin");

    private final JdbcTemplate jdbc;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder;

    /** Off by default. Only for local development, because the token lets anyone reset the account. */
    @Value("${pasa.auth.log-reset-tokens:false}")
    private boolean logResetTokens;

    public AuthService(JdbcTemplate jdbc, JwtUtil jwtUtil, BCryptPasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.jwtUtil = jwtUtil;
        this.encoder = encoder;
    }

    // ── Parent ────────────────────────────────────────────────────────────

    public TokenResponse registerParent(RegisterRequest req) {
        var existing = jdbc.queryForList(
            "SELECT id FROM auth.users WHERE email = ?", req.email()
        );
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        UUID userId = UUID.randomUUID();
        String hash = encoder.encode(req.password());
        String fullName = req.firstName().trim() + " " + req.lastName().trim();

        jdbc.update("""
            INSERT INTO auth.users
              (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data,
               role, aud, created_at, updated_at)
            VALUES
              (?, ?, ?, now(),
               jsonb_build_object('full_name', ?, 'first_name', ?, 'last_name', ?),
               'authenticated', 'authenticated', now(), now())
            """,
            userId, req.email(), hash, fullName, req.firstName(), req.lastName()
        );

        // Profile + default parent role created by DB trigger (handle_new_user)
        return issueTokens(userId, req.email(), "parent");
    }

    /**
     * Single sign-in for the mobile app, which serves parents and school staff from one form.
     * Super admins are still refused here and must use the admin portal.
     */
    public TokenResponse signIn(SignInRequest req) {
        UUID userId = verifyCredentials(req);
        String role = getPrimaryRole(userId);

        if ("super_admin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Admin accounts sign in via the admin portal");
        }
        return issueTokens(userId, req.email(), role);
    }

    /**
     * Exchange a valid refresh token for a new access token and a new refresh token.
     * The role is re-read from the database so role changes take effect, and a deleted
     * account can no longer refresh. Any failure returns the same 401 to avoid leaking why.
     */
    public TokenResponse refresh(RefreshRequest req) {
        if (!jwtUtil.isValidRefreshToken(req.refreshToken())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }

        UUID userId = jwtUtil.getUserId(req.refreshToken());
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT email FROM auth.users WHERE id = ?", userId
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }

        String role = getPrimaryRole(userId);
        if ("super_admin".equals(role)) {
            // Admin sessions are never extended through the mobile refresh flow.
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }
        return issueTokens(userId, String.valueOf(rows.get(0).get("email")), role);
    }

    private TokenResponse issueTokens(UUID userId, String email, String role) {
        String access = jwtUtil.generateToken(userId, email, role);
        String refresh = jwtUtil.generateRefreshToken(userId);
        return new TokenResponse(access, userId.toString(), role, refresh);
    }

    public TokenResponse signInParent(SignInRequest req) {
        UUID userId = verifyCredentials(req);
        String role = getPrimaryRole(userId);

        // Block staff from using parent login
        if (STAFF_ROLES.contains(role) || "super_admin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Staff accounts must sign in via the school portal");
        }

        return issueTokens(userId, req.email(), role);
    }

    // ── Staff ─────────────────────────────────────────────────────────────

    public TokenResponse signInStaff(SignInRequest req) {
        UUID userId = verifyCredentials(req);
        String role = getPrimaryRole(userId);

        // Block parents from using staff login
        if ("parent".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Parent accounts sign in via the parent portal");
        }
        // Block super_admin from staff portal — they use admin portal
        if ("super_admin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Admin accounts sign in via the admin portal");
        }

        return issueTokens(userId, req.email(), role);
    }

    // ── Super Admin ───────────────────────────────────────────────────────

    public TokenResponse signInAdmin(SignInRequest req) {
        UUID userId = verifyCredentials(req);
        String role = getPrimaryRole(userId);

        if (!"super_admin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return issueTokens(userId, req.email(), role);
    }

    // ── Staff Invite ──────────────────────────────────────────────────────

    public TokenResponse inviteStaff(String email, String firstName, String lastName,
                                      String role, String staffNumber, String position, UUID schoolId) {
        // Validate role
        Set<String> validRoles = Set.of("teacher", "principal", "school_admin");
        if (!validRoles.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + role);
        }

        // Check if user already exists
        var existing = jdbc.queryForList("SELECT id FROM auth.users WHERE email = ?", email);
        UUID userId;

        if (!existing.isEmpty()) {
            userId = UUID.fromString(existing.get(0).get("id").toString());
        } else {
            // Create user account with temporary password
            userId = UUID.randomUUID();
            String tempPassword = UUID.randomUUID().toString().substring(0, 12);
            String hash = encoder.encode(tempPassword);
            String fullName = firstName.trim() + " " + lastName.trim();

            jdbc.update("""
                INSERT INTO auth.users
                  (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data,
                   role, aud, created_at, updated_at)
                VALUES
                  (?, ?, ?, now(),
                   jsonb_build_object('full_name', ?, 'first_name', ?, 'last_name', ?),
                   'authenticated', 'authenticated', now(), now())
                """,
                userId, email, hash, fullName, firstName, lastName
            );
        }

        // Assign role at school
        jdbc.update(
            "INSERT INTO public.user_roles (id, user_id, role, school_id) VALUES (?, ?, ?::app_role, ?) ON CONFLICT (user_id, role, school_id) DO NOTHING",
            UUID.randomUUID(), userId, role, schoolId
        );

        // Create staff record
        jdbc.update(
            "INSERT INTO public.staff (id, user_id, school_id, staff_number, position) VALUES (?, ?, ?, ?, ?) ON CONFLICT (user_id, school_id) DO NOTHING",
            UUID.randomUUID(), userId, schoolId, staffNumber, position
        );

        return new TokenResponse(null, userId.toString(), role);
    }

    // ── Shared helpers ────────────────────────────────────────────────────

    private UUID verifyCredentials(SignInRequest req) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT u.id, u.encrypted_password FROM auth.users u WHERE u.email = ?",
            req.email()
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        Map<String, Object> row = rows.get(0);
        UUID userId = UUID.fromString(row.get("id").toString());
        String hash = (String) row.get("encrypted_password");

        if (!encoder.matches(req.password(), hash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return userId;
    }

    private String getPrimaryRole(UUID userId) {
        var roles = jdbc.queryForList(
            "SELECT role FROM public.user_roles WHERE user_id = ? ORDER BY created_at ASC",
            userId
        );
        if (roles.isEmpty()) return "parent";
        String[] priority = {"super_admin", "principal", "school_admin", "teacher", "parent"};
        for (String p : priority) {
            for (var r : roles) {
                if (p.equals(r.get("role").toString())) return p;
            }
        }
        return roles.get(0).get("role").toString();
    }

    // ── Password Reset ────────────────────────────────────────────────────

    public void forgotPassword(ForgotPasswordRequest req) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id FROM auth.users WHERE email = ?", req.email()
        );
        if (rows.isEmpty()) {
            // Don't reveal whether email exists — just return silently.
            // The address is deliberately not logged (personal information).
            log.info("Password reset requested for an unknown address");
            return;
        }

        UUID userId = UUID.fromString(rows.get(0).get("id").toString());
        String token = UUID.randomUUID().toString();

        // Store reset token (expires in 1 hour)
        jdbc.update("""
            INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
            VALUES (?, ?, now() + interval '1 hour')
            ON CONFLICT (user_id) DO UPDATE
            SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
            """, userId, token);

        // TODO: Send email with reset link containing token. No email provider is configured
        // yet, so until one is, password reset cannot complete outside local development.
        if (logResetTokens) {
            // Development only: lets a developer complete the flow without email.
            log.warn("DEV ONLY - password reset token for user {}: {}", userId, token);
        } else {
            log.info("Password reset token generated for user {}", userId);
        }
    }

    public void resetPassword(ResetPasswordRequest req) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            """
            SELECT user_id FROM public.password_reset_tokens
            WHERE token = ? AND expires_at > now()
            """, req.token()
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }

        UUID userId = UUID.fromString(rows.get(0).get("user_id").toString());
        String hash = encoder.encode(req.newPassword());

        jdbc.update("UPDATE auth.users SET encrypted_password = ?, updated_at = now() WHERE id = ?",
            hash, userId);

        // Remove used token
        jdbc.update("DELETE FROM public.password_reset_tokens WHERE user_id = ?", userId);

        log.info("Password successfully reset for user {}", userId);
    }
}
