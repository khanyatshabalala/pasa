package com.pasa.backend.controller;

import com.pasa.backend.dto.response.NotificationResponse;
import com.pasa.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> getNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return notificationService.getNotifications(userId, unreadOnly);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return notificationService.getUnreadCount(userId);
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return notificationService.markRead(id, userId);
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }
}
