package com.pasa.backend.service;

import com.pasa.backend.domain.entity.Notification;
import com.pasa.backend.dto.response.NotificationResponse;
import com.pasa.backend.mapper.NotificationMapper;
import com.pasa.backend.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepo;

    public NotificationService(NotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    public List<NotificationResponse> getNotifications(UUID userId, boolean unreadOnly) {
        List<Notification> notifications;
        if (unreadOnly) {
            notifications = notificationRepo.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);
        } else {
            notifications = notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return notifications.stream().map(NotificationMapper::toResponse).toList();
    }

    public Map<String, Long> getUnreadCount(UUID userId) {
        long count = notificationRepo.countByUserIdAndReadAtIsNull(userId);
        return Map.of("count", count);
    }

    public NotificationResponse markRead(UUID id, UUID userId) {
        Notification notification = notificationRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (notification.getReadAt() == null) {
            notification.setReadAt(OffsetDateTime.now());
            notificationRepo.save(notification);
        }
        return NotificationMapper.toResponse(notification);
    }

    public void markAllRead(UUID userId) {
        List<Notification> unread = notificationRepo.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);
        OffsetDateTime now = OffsetDateTime.now();
        unread.forEach(n -> n.setReadAt(now));
        notificationRepo.saveAll(unread);
    }
}
