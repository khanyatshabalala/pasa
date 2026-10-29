package com.pasa.backend.notification;

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
