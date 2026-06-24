package com.pasa.backend.service;

import com.pasa.backend.dto.request.ForgotPasswordRequest;
import com.pasa.backend.dto.request.RegisterRequest;
import com.pasa.backend.dto.request.ResetPasswordRequest;
import com.pasa.backend.dto.request.SignInRequest;
import com.pasa.backend.dto.response.TokenResponse;
import com.pasa.backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
        String token = jwtUtil.generateToken(userId, req.email(), "parent");
        return new TokenResponse(token, userId.toString(), "parent");
    }

    public TokenResponse signInParent(SignInRequest req) {
        UUID userId = verifyCredentials(req);
        String role = getPrimaryRole(userId);

        // Block staff from using parent login
        if (STAFF_ROLES.contains(role) || "super_admin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Staff accounts must sign in via the school portal");
        }

        String token = jwtUtil.generateToken(userId, req.email(), role);
        return new TokenResponse(token, userId.toString(), role);
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

        String token = jwtUtil.generateToken(userId, req.email(), role);
        return new TokenResponse(token, userId.toString(), role);
    }

    // ── Super Admin ───────────────────────────────────────────────────────

    public TokenResponse signInAdmin(SignInRequest req) {
        UUID userId = verifyCredentials(req);
        String role = getPrimaryRole(userId);

        if (!"super_admin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        String token = jwtUtil.generateToken(userId, req.email(), role);
        return new TokenResponse(token, userId.toString(), role);
    }

    // ── Password Reset ───────────────────────────────────────────────────

    public void requestPasswordReset(String email) {
        var rows = jdbc.queryForList("SELECT id FROM auth.users WHERE email = ?", email);
        if (rows.isEmpty()) return; // Don't reveal if email exists

        UUID userId = UUID.fromString(rows.get(0).get("id").toString());
        String token = UUID.randomUUID().toString();

        // Store reset token (expires in 1 hour)
        jdbc.update("""
            INSERT INTO public.notifications (user_id, title, body, category, link)
            VALUES (?, 'Password Reset Token', ?, 'system', '/reset-password')
            """, userId, "Token: " + token);

        // TODO: Send email with reset link containing the token
        // For now, token is stored as a notification (visible in logs)
    }

    public void resetPassword(String token, String newPassword) {
        // TODO: Implement proper token validation table
        // For now, this is a placeholder that will be completed with email integration
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
            "Password reset requires email integration. Contact admin to reset your password.");
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
            // Don't reveal whether email exists — just return silently
            log.info("Password reset requested for non-existent email: {}", req.email());
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

        // TODO: Send email with reset link containing token
        log.info("Password reset token generated for user {}: {}", userId, token);
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
