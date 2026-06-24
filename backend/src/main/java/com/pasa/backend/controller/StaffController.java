package com.pasa.backend.controller;

import com.pasa.backend.dto.request.AddStaffRequest;
import com.pasa.backend.dto.request.InviteStaffRequest;
import com.pasa.backend.dto.response.InviteStaffResponse;
import com.pasa.backend.dto.response.StaffResponse;
import com.pasa.backend.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schools/{schoolId}/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public List<StaffResponse> getStaff(@PathVariable UUID schoolId) {
        return staffService.getStaff(schoolId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<StaffResponse> addStaff(
            @PathVariable UUID schoolId,
            @Valid @RequestBody AddStaffRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffService.addStaff(schoolId, req));
    }

    @PostMapping("/invite")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<InviteStaffResponse> inviteStaff(
            @PathVariable UUID schoolId,
            @Valid @RequestBody InviteStaffRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffService.inviteStaff(schoolId, req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public StaffResponse updateStaff(
            @PathVariable UUID schoolId,
            @PathVariable UUID id,
            @Valid @RequestBody AddStaffRequest req
    ) {
        return staffService.updateStaff(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> removeStaff(
            @PathVariable UUID schoolId,
            @PathVariable UUID id
    ) {
        staffService.removeStaff(id);
        return ResponseEntity.noContent().build();
    }
}
