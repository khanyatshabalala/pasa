package com.pasa.backend.calendar;


public final class NationalCalendarMapper {

    private NationalCalendarMapper() {}

    public static NationalCalendarResponse toResponse(NationalCalendarEvent event) {
        return new NationalCalendarResponse(
            event.getId(),
            event.getTitle(),
            event.getEventDate(),
            event.getEventType(),
            event.getDescription()
        );
    }
}
