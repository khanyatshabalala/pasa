package com.pasa.backend.schoolclass;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/classes")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<ClassResponse> getClasses(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) Integer year,
            Authentication auth
    ) {
        return classService.getClasses(schoolId, year, (UUID) auth.getPrincipal());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ClassResponse> createClass(
            @PathVariable UUID schoolId,
            @Valid @RequestBody CreateClassRequest req,
            Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                classService.createClass(schoolId, req, (UUID) auth.getPrincipal()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ClassResponse updateClass(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateClassRequest req,
            Authentication auth
    ) {
        return classService.updateClass(schoolId, id, req, (UUID) auth.getPrincipal());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteClass(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            Authentication auth
    ) {
        classService.deleteClass(schoolId, id, (UUID) auth.getPrincipal());
        return ResponseEntity.noContent().build();
    }
}
