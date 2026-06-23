package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {
    List<CalendarEvent> findBySchoolIdOrderByEventDateAsc(UUID schoolId);
    List<CalendarEvent> findBySchoolIdAndEventDateBetweenOrderByEventDateAsc(UUID schoolId, LocalDate from, LocalDate to);
    List<CalendarEvent> findBySchoolIdIsNullOrderByEventDateAsc(); // national events
}
