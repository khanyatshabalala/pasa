package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.CalendarEvent;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.CalendarEventRepository;
import com.pasa.backend.repository.SchoolRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/calendar")
public class CalendarController {

    private final CalendarEventRepository calendarRepo;
    private final SchoolRepository schoolRepo;

    public CalendarController(CalendarEventRepository calendarRepo, SchoolRepository schoolRepo) {
        this.calendarRepo = calendarRepo;
        this.schoolRepo = schoolRepo;
    }

    @GetMapping
    public List<CalendarEvent> getEvents(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));

        List<CalendarEvent> events = new ArrayList<>();
        // School-specific events
        if (from != null && to != null) {
            events.addAll(calendarRepo.findBySchoolIdAndEventDateBetweenOrderByEventDateAsc(schoolId, from, to));
        } else {
            events.addAll(calendarRepo.findBySchoolIdOrderByEventDateAsc(schoolId));
        }
        // National/public events (school_id IS NULL)
        events.addAll(calendarRepo.findBySchoolIdIsNullOrderByEventDateAsc());
        return events;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<CalendarEvent> createEvent(
            @PathVariable UUID schoolId,
            @Valid @RequestBody CalendarEvent event,
            Authentication auth
    ) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        event.setSchool(school);
        event.setCreatedBy((UUID) auth.getPrincipal());
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarRepo.save(event));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public CalendarEvent updateEvent(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody CalendarEvent updated
    ) {
        CalendarEvent existing = calendarRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setEventDate(updated.getEventDate());
        existing.setEventTime(updated.getEventTime());
        existing.setEventType(updated.getEventType());
        return calendarRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID schoolId, @PathVariable UUID id) {
        CalendarEvent event = calendarRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        calendarRepo.delete(event);
        return ResponseEntity.noContent().build();
    }
}
