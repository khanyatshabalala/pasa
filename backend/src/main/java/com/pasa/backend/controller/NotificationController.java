package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.Notification;
import com.pasa.backend.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepo;

    public NotificationController(NotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    @GetMapping
    public List<Notification> getNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        if (unreadOnly) {
            return notificationRepo.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);
        }
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        long count = notificationRepo.countByUserIdAndReadAtIsNull(userId);
        return Map.of("count", count);
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(@PathVariable UUID id, Authentication auth) {
        Notification notification = notificationRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUserId().equals((UUID) auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (notification.getReadAt() == null) {
            notification.setReadAt(OffsetDateTime.now());
            notificationRepo.save(notification);
        }
        return notification;
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<Notification> unread = notificationRepo.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);
        OffsetDateTime now = OffsetDateTime.now();
        unread.forEach(n -> n.setReadAt(now));
        notificationRepo.saveAll(unread);
        return ResponseEntity.noContent().build();
    }
}
