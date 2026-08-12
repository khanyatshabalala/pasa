package com.pasa.backend.controller;

import com.pasa.backend.dto.response.DisciplineResponse;
import com.pasa.backend.service.DisciplineService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * School-level discipline endpoint — lists all discipline records for every learner
 * at a given school. Used by the school discipline management page.
 */
@RestController
@RequestMapping("/api/v1/schools/{schoolId}/discipline")
public class SchoolDisciplineController {

    private final DisciplineService disciplineService;

    public SchoolDisciplineController(DisciplineService disciplineService) {
        this.disciplineService = disciplineService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<DisciplineResponse> getDisciplineForSchool(@PathVariable UUID schoolId) {
        return disciplineService.getDisciplineForSchool(schoolId);
    }
}
