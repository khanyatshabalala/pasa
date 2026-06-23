package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.domain.entity.SchoolClass;
import com.pasa.backend.repository.SchoolClassRepository;
import com.pasa.backend.repository.SchoolRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/classes")
public class ClassController {

    private final SchoolClassRepository classRepo;
    private final SchoolRepository schoolRepo;

    public ClassController(SchoolClassRepository classRepo, SchoolRepository schoolRepo) {
        this.classRepo = classRepo;
        this.schoolRepo = schoolRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<SchoolClass> getClasses(
            @PathVariable UUID schoolId,
            @RequestParam(required = false) Integer year
    ) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        int academicYear = year != null ? year : Year.now().getValue();
        return classRepo.findBySchoolIdAndAcademicYear(schoolId, academicYear);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<SchoolClass> createClass(
            @PathVariable UUID schoolId,
            @Valid @RequestBody SchoolClass schoolClass,
            Authentication auth
    ) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        schoolClass.setSchool(school);
        if (schoolClass.getAcademicYear() == null) {
            schoolClass.setAcademicYear(Year.now().getValue());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(classRepo.save(schoolClass));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public SchoolClass updateClass(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody SchoolClass updated
    ) {
        SchoolClass existing = classRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        existing.setName(updated.getName());
        existing.setGradeId(updated.getGradeId());
        existing.setTeacherUserId(updated.getTeacherUserId());
        return classRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteClass(@PathVariable UUID schoolId, @PathVariable UUID id) {
        SchoolClass cls = classRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        classRepo.delete(cls);
        return ResponseEntity.noContent().build();
    }
}
