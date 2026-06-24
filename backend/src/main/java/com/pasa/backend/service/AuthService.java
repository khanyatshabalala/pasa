package com.pasa.backend.service;

import com.pasa.backend.dto.request.RegisterRequest;
import com.pasa.backend.dto.request.SignInRequest;
import com.pasa.backend.dto.response.TokenResponse;
import com.pasa.backend.security.JwtUtil;
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
}
