package com.pasa.backend.notification;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Web/mobile push-token registration for the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/push-tokens")
public class PushTokenController {

    private final PushTokenService service;

    public PushTokenController(PushTokenService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Void> register(
            @Valid @RequestBody RegisterPushTokenRequest req, Authentication auth) {
        service.register((UUID) auth.getPrincipal(), req);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<Void> unregister(@PathVariable String token, Authentication auth) {
        service.unregister((UUID) auth.getPrincipal(), token);
        return ResponseEntity.noContent().build();
    }
}
