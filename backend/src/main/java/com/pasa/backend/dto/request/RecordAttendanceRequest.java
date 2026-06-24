package com.pasa.backend.dto.request;

import com.pasa.backend.domain.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RecordAttendanceRequest(
    @NotNull LocalDate date,
    @NotNull AttendanceStatus status,
    String notes
) {}
