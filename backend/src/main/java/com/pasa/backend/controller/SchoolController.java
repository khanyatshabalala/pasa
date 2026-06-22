package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.SchoolRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools")
public class SchoolController {

    private final SchoolRepository schoolRepo;

    public SchoolController(SchoolRepository schoolRepo) {
        this.schoolRepo = schoolRepo;
    }

    @GetMapping
    public List<School> listSchools(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district
    ) {
        if (province != null) return schoolRepo.findByProvince(province);
        if (district != null) return schoolRepo.findByDistrict(district);
        return schoolRepo.findAll();
    }

    @GetMapping("/{id}")
    public School getSchool(@PathVariable UUID id) {
        return schoolRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<School> createSchool(@Valid @RequestBody School school) {
        if (schoolRepo.existsByEmisNumber(school.getEmisNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EMIS number already registered");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolRepo.save(school));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PRINCIPAL','SCHOOL_ADMIN')")
    public School updateSchool(@PathVariable UUID id, @Valid @RequestBody School updated) {
        School existing = schoolRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        return schoolRepo.save(updated);
    }
}
