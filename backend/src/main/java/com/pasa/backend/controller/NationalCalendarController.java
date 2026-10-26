package com.pasa.backend.controller;

import com.pasa.backend.dto.response.NationalCalendarResponse;
import com.pasa.backend.service.NationalCalendarService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Public, read-only SA national calendar (term dates + public holidays).
 * No authentication required — whitelisted in SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/national-calendar")
public class NationalCalendarController {

    private final NationalCalendarService service;

    public NationalCalendarController(NationalCalendarService service) {
        this.service = service;
    }

    @GetMapping
    public List<NationalCalendarResponse> getEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer year
    ) {
        return service.getEvents(from, to, year);
    }
}
