package com.pasa.backend.controller;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.domain.entity.Staff;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.repository.StaffRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/staff")
public class StaffController {

    private final StaffRepository staffRepo;
    private final SchoolRepository schoolRepo;

    public StaffController(StaffRepository staffRepo, SchoolRepository schoolRepo) {
        this.staffRepo = staffRepo;
        this.schoolRepo = schoolRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<Staff> getStaff(@PathVariable UUID schoolId) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        return staffRepo.findBySchoolId(schoolId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Staff> addStaff(
            @PathVariable UUID schoolId,
            @Valid @RequestBody Staff staff
    ) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        staff.setSchool(school);
        return ResponseEntity.status(HttpStatus.CREATED).body(staffRepo.save(staff));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public Staff updateStaff(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody Staff updated
    ) {
        Staff existing = staffRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
        existing.setPosition(updated.getPosition());
        existing.setStaffNumber(updated.getStaffNumber());
        return staffRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> removeStaff(@PathVariable UUID schoolId, @PathVariable UUID id) {
        Staff staff = staffRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
        staffRepo.delete(staff);
        return ResponseEntity.noContent().build();
    }
}
