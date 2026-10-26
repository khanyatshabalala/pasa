package com.pasa.backend.service;

import com.pasa.backend.domain.entity.CalendarEvent;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.dto.request.CreateCalendarEventRequest;
import com.pasa.backend.dto.response.CalendarEventResponse;
import com.pasa.backend.mapper.CalendarEventMapper;
import com.pasa.backend.repository.CalendarEventRepository;
import com.pasa.backend.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CalendarService {

    private final CalendarEventRepository calendarRepo;
    private final SchoolRepository schoolRepo;

    public CalendarService(CalendarEventRepository calendarRepo, SchoolRepository schoolRepo) {
        this.calendarRepo = calendarRepo;
        this.schoolRepo = schoolRepo;
    }

    public List<CalendarEventResponse> getEvents(UUID schoolId, LocalDate from, LocalDate to) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));

        List<CalendarEvent> events = new ArrayList<>();
        if (from != null && to != null) {
            events.addAll(calendarRepo.findBySchoolIdAndEventDateBetweenOrderByEventDateAsc(schoolId, from, to));
        } else {
            events.addAll(calendarRepo.findBySchoolIdOrderByEventDateAsc(schoolId));
        }
        events.addAll(calendarRepo.findBySchoolIdIsNullOrderByEventDateAsc());
        return events.stream().map(CalendarEventMapper::toResponse).toList();
    }

    public CalendarEventResponse createEvent(UUID schoolId, CreateCalendarEventRequest req, UUID userId) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        CalendarEvent event = CalendarEventMapper.toEntity(req);
        event.setSchool(school);
        event.setCreatedBy(userId);
        return CalendarEventMapper.toResponse(calendarRepo.save(event));
    }

    public CalendarEventResponse updateEvent(UUID id, CreateCalendarEventRequest req) {
        CalendarEvent existing = calendarRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        existing.setTitle(req.title());
        existing.setDescription(req.description());
        existing.setEventDate(req.eventDate());
        existing.setEventTime(req.eventTime());
        existing.setEventType(req.eventType());
        existing.setClassId(req.classId());
        return CalendarEventMapper.toResponse(calendarRepo.save(existing));
    }

    public void deleteEvent(UUID id) {
        CalendarEvent event = calendarRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        calendarRepo.delete(event);
    }
}
