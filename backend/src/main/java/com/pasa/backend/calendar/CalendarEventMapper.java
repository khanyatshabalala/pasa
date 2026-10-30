package com.pasa.backend.calendar;


public final class CalendarEventMapper {

    private CalendarEventMapper() {}

    public static CalendarEventResponse toResponse(CalendarEvent event) {
        return new CalendarEventResponse(
            event.getId(),
            event.getSchool() != null ? event.getSchool().getId() : null,
            event.getTitle(),
            event.getDescription(),
            event.getEventDate(),
            event.getEventTime(),
            event.getEventType(),
            event.getClassId()
        );
    }

    public static CalendarEvent toEntity(CreateCalendarEventRequest req) {
        CalendarEvent event = new CalendarEvent();
        event.setTitle(req.title());
        event.setDescription(req.description());
        event.setEventDate(req.eventDate());
        event.setEventTime(req.eventTime());
        event.setEventType(req.eventType());
        event.setClassId(req.classId());
        return event;
    }
}
