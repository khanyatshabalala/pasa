package com.pasa.backend.controller;

import com.pasa.backend.dto.request.CreateDisciplineRequest;
import com.pasa.backend.dto.response.DisciplineResponse;
import com.pasa.backend.service.DisciplineService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learners/{learnerId}/discipline")
public class DisciplineController {

    private final DisciplineService disciplineService;

    public DisciplineController(DisciplineService disciplineService) {
        this.disciplineService = disciplineService;
    }

    @GetMapping
    public List<DisciplineResponse> getDiscipline(@PathVariable UUID learnerId) {
        return disciplineService.getDiscipline(learnerId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<DisciplineResponse> createRecord(
            @PathVariable UUID learnerId,
            @Valid @RequestBody CreateDisciplineRequest req,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(disciplineService.createRecord(learnerId, req, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteRecord(@PathVariable UUID learnerId, @PathVariable UUID id) {
        disciplineService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }
}
