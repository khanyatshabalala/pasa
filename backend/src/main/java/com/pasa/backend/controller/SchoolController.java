package com.pasa.backend.controller;

import com.pasa.backend.dto.request.CreateSchoolRequest;
import com.pasa.backend.dto.response.SchoolResponse;
import com.pasa.backend.service.SchoolService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools")
public class SchoolController {

    private final SchoolService schoolService;

    public SchoolController(SchoolService schoolService) {
        this.schoolService = schoolService;
    }

    @GetMapping
    public List<SchoolResponse> listSchools(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district
    ) {
        return schoolService.listSchools(province, district);
    }

    @GetMapping("/{id}")
    public SchoolResponse getSchool(@PathVariable UUID id) {
        return schoolService.getSchool(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SchoolResponse> createSchool(@Valid @RequestBody CreateSchoolRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolService.createSchool(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PRINCIPAL','SCHOOL_ADMIN')")
    public SchoolResponse updateSchool(@PathVariable UUID id, @Valid @RequestBody CreateSchoolRequest req) {
        return schoolService.updateSchool(id, req);
    }
}
