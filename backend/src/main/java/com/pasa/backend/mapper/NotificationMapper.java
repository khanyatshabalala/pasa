package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.Notification;
import com.pasa.backend.dto.response.NotificationResponse;

public final class NotificationMapper {

    private NotificationMapper() {}

    public static NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getTitle(),
            notification.getBody(),
            notification.getCategory(),
            notification.getLink(),
            notification.getReadAt(),
            notification.getCreatedAt()
        );
    }
}
