package com.pasa.backend.service;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.domain.entity.Staff;
import com.pasa.backend.dto.request.AddStaffRequest;
import com.pasa.backend.dto.response.StaffResponse;
import com.pasa.backend.mapper.StaffMapper;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.repository.StaffRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class StaffService {

    private final StaffRepository staffRepo;
    private final SchoolRepository schoolRepo;

    public StaffService(StaffRepository staffRepo, SchoolRepository schoolRepo) {
        this.staffRepo = staffRepo;
        this.schoolRepo = schoolRepo;
    }

    public List<StaffResponse> getStaff(UUID schoolId) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        return staffRepo.findBySchoolId(schoolId).stream()
                .map(StaffMapper::toResponse)
                .toList();
    }

    public StaffResponse addStaff(UUID schoolId, AddStaffRequest req) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        Staff staff = StaffMapper.toEntity(req);
        staff.setSchool(school);
        return StaffMapper.toResponse(staffRepo.save(staff));
    }

    public StaffResponse updateStaff(UUID id, AddStaffRequest req) {
        Staff existing = staffRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
        existing.setPosition(req.position());
        existing.setStaffNumber(req.staffNumber());
        return StaffMapper.toResponse(staffRepo.save(existing));
    }

    public void removeStaff(UUID id) {
        Staff staff = staffRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
        staffRepo.delete(staff);
    }
}
