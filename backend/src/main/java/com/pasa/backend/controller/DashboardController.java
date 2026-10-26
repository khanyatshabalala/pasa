package com.pasa.backend.controller;

import com.pasa.backend.dto.response.ParentDashboardResponse;
import com.pasa.backend.dto.response.SchoolDashboardResponse;
import com.pasa.backend.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/schools/{schoolId}/dashboard")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public SchoolDashboardResponse schoolDashboard(@PathVariable UUID schoolId) {
        return dashboardService.schoolDashboard(schoolId);
    }

    @GetMapping("/parents/dashboard")
    @PreAuthorize("hasRole('PARENT')")
    public ParentDashboardResponse parentDashboard(Authentication auth) {
        return dashboardService.parentDashboard((UUID) auth.getPrincipal());
    }
}
