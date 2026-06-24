package com.pasa.backend.controller;

import com.pasa.backend.dto.request.RegisterRequest;
import com.pasa.backend.dto.request.SignInRequest;
import com.pasa.backend.dto.response.TokenResponse;
import com.pasa.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
