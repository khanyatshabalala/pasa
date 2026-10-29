package com.pasa.backend.attendance;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RecordAttendanceRequest(
    @NotNull LocalDate date,
    @NotNull AttendanceStatus status,
    String notes
) {}
