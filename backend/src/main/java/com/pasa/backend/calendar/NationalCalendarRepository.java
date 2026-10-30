package com.pasa.backend.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface NationalCalendarRepository extends JpaRepository<NationalCalendarEvent, UUID> {

    List<NationalCalendarEvent> findByEventDateBetweenOrderByEventDateAsc(LocalDate from, LocalDate to);

    List<NationalCalendarEvent> findByYearOrderByEventDateAsc(Integer year);

    List<NationalCalendarEvent> findAllByOrderByEventDateAsc();
}
