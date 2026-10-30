package com.pasa.backend.school;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class SchoolService {

    private final SchoolRepository schoolRepo;
    private final JdbcTemplate jdbc;

    public SchoolService(SchoolRepository schoolRepo, JdbcTemplate jdbc) {
        this.schoolRepo = schoolRepo;
        this.jdbc = jdbc;
    }

    public List<SchoolResponse> listSchools(String province, String district) {
        List<School> schools;
        if (province != null) {
            schools = schoolRepo.findByProvince(province);
        } else if (district != null) {
            schools = schoolRepo.findByDistrict(district);
        } else {
            schools = schoolRepo.findAll();
        }
        return schools.stream().map(SchoolMapper::toResponse).toList();
    }

    public SchoolResponse getSchool(UUID id) {
        School school = schoolRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        return SchoolMapper.toResponse(school);
    }

    public SchoolResponse createSchool(CreateSchoolRequest req) {
        validate(req);
        if (schoolRepo.existsByEmisNumber(req.emisNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EMIS number already registered");
        }
        School school = SchoolMapper.toEntity(req);
        return SchoolMapper.toResponse(schoolRepo.save(school));
    }

    public SchoolResponse updateSchool(UUID id, CreateSchoolRequest req) {
        validate(req);
        School existing = schoolRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        SchoolMapper.applyRequest(existing, req);
        return SchoolMapper.toResponse(schoolRepo.save(existing));
    }

    public void recalculatePerformance(UUID id) {
        if (!schoolRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found");
        }
        jdbc.update("SELECT public.recalculate_school_performance(?::uuid)", id);
    }

    private void validate(CreateSchoolRequest req) {
        if (req.gradeFrom() != null && req.gradeTo() != null && req.gradeFrom() > req.gradeTo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "gradeFrom must be <= gradeTo");
        }
        if (req.applicationOpen() != null && req.applicationClose() != null
                && req.applicationClose().isBefore(req.applicationOpen())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "applicationClose must be on or after applicationOpen");
        }
    }
}
