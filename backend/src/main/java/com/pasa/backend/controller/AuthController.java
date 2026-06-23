package com.pasa.backend.controller;

import com.pasa.backend.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JdbcTemplate jdbc;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder;

    public AuthController(JdbcTemplate jdbc, JwtUtil jwtUtil) {
        this.jdbc = jdbc;
        this.jwtUtil = jwtUtil;
        this.encoder = new BCryptPasswordEncoder();
    }

    // ── Sign in ────────────────────────────────────────────────────────────
    @PostMapping("/signin")
    public ResponseEntity<TokenResponse> signIn(@Valid @RequestBody SignInRequest req) {
        // Look up user in auth.users via the profiles view
        var rows = jdbc.queryForList(
            "SELECT u.id, u.encrypted_password FROM auth.users u WHERE u.email = ?",
            req.email()
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        var row = rows.get(0);
        UUID userId = UUID.fromString(row.get("id").toString());
        String hash = (String) row.get("encrypted_password");

        if (!encoder.matches(req.password(), hash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        // Get primary role
        String role = getPrimaryRole(userId);
        String token = jwtUtil.generateToken(userId, req.email(), role);
        return ResponseEntity.ok(new TokenResponse(token, userId.toString(), role));
    }

    // ── Register (parent only — staff accounts created by school admin) ───
    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest req) {
        // Check email not already taken
        var existing = jdbc.queryForList(
            "SELECT id FROM auth.users WHERE email = ?", req.email()
        );
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        UUID userId = UUID.randomUUID();
        String hash = encoder.encode(req.password());
        String fullName = req.firstName().trim() + " " + req.lastName().trim();

        // Insert into auth.users
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

        // Profile and default parent role are created by the handle_new_user trigger
        String token = jwtUtil.generateToken(userId, req.email(), "parent");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new TokenResponse(token, userId.toString(), "parent"));
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private String getPrimaryRole(UUID userId) {
        var roles = jdbc.queryForList(
            "SELECT role FROM public.user_roles WHERE user_id = ? ORDER BY created_at ASC",
            userId
        );
        if (roles.isEmpty()) return "parent";
        // Priority order
        String[] priority = {"super_admin", "principal", "school_admin", "teacher", "parent"};
        for (String p : priority) {
            for (var r : roles) {
                if (p.equals(r.get("role").toString())) return p;
            }
        }
        return roles.get(0).get("role").toString();
    }

    // ── Request / Response records ─────────────────────────────────────────
    public record SignInRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 72) String password
    ) {}

    public record RegisterRequest(
        @NotBlank @Size(min = 1, max = 50) String firstName,
        @NotBlank @Size(min = 1, max = 50) String lastName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 72) String password
    ) {}

    public record TokenResponse(String token, String userId, String role) {}
}
