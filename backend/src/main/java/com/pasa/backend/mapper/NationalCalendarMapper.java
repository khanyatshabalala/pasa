package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.NationalCalendarEvent;
import com.pasa.backend.dto.response.NationalCalendarResponse;

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
