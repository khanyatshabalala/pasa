package com.pasa.backend.controller;

import com.pasa.backend.dto.request.CreateClassRequest;
import com.pasa.backend.dto.response.ClassResponse;
import com.pasa.backend.service.ClassService;
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
            @RequestParam(required = false) Integer year
    ) {
        return classService.getClasses(schoolId, year);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ClassResponse> createClass(
            @PathVariable UUID schoolId,
            @Valid @RequestBody CreateClassRequest req,
            Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classService.createClass(schoolId, req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ClassResponse updateClass(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateClassRequest req
    ) {
        return classService.updateClass(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteClass(@PathVariable UUID schoolId, @PathVariable UUID id) {
        classService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }
}
