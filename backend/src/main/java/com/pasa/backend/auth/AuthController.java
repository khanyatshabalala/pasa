package com.pasa.backend.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ── Parent endpoints ──────────────────────────────────────────────────

    @PostMapping("/parent/register")
    public ResponseEntity<TokenResponse> parentRegister(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerParent(req));
    }

    @PostMapping("/parent/signin")
    public ResponseEntity<TokenResponse> parentSignIn(@Valid @RequestBody SignInRequest req) {
        return ResponseEntity.ok(authService.signInParent(req));
    }

    // ── Staff endpoints ───────────────────────────────────────────────────

    @PostMapping("/staff/signin")
    public ResponseEntity<TokenResponse> staffSignIn(@Valid @RequestBody SignInRequest req) {
        return ResponseEntity.ok(authService.signInStaff(req));
    }

    // ── Super admin endpoint ──────────────────────────────────────────────

    @PostMapping("/admin/signin")
    public ResponseEntity<TokenResponse> adminSignIn(@Valid @RequestBody SignInRequest req) {
        return ResponseEntity.ok(authService.signInAdmin(req));
    }

    // ── Password reset ────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }
}
