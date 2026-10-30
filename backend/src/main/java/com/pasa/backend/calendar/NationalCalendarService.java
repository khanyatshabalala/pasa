package com.pasa.backend.calendar;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class NationalCalendarService {

    private final NationalCalendarRepository repo;

    public NationalCalendarService(NationalCalendarRepository repo) {
        this.repo = repo;
    }

    /**
     * Resolution order:
     *   1. from/to window (inclusive). If from &gt; to, return an empty list.
     *   2. explicit year.
     *   3. otherwise the LATEST year present in the table (build-must-dos NIT-1),
     *      falling back to an empty list when the table is empty.
     */
    public List<NationalCalendarResponse> getEvents(LocalDate from, LocalDate to, Integer year) {
        List<NationalCalendarEvent> events;

        if (from != null && to != null) {
            if (from.isAfter(to)) {
                return List.of();
            }
            events = repo.findByEventDateBetweenOrderByEventDateAsc(from, to);
        } else if (year != null) {
            events = repo.findByYearOrderByEventDateAsc(year);
        } else {
            Integer latestYear = latestYear();
            events = latestYear == null ? List.of() : repo.findByYearOrderByEventDateAsc(latestYear);
        }

        return events.stream().map(NationalCalendarMapper::toResponse).toList();
    }

    private Integer latestYear() {
        return repo.findAll().stream()
                .map(NationalCalendarEvent::getYear)
                .filter(y -> y != null)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }
}
