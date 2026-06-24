package com.pasa.backend.service;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.dto.request.CreateSchoolRequest;
import com.pasa.backend.dto.response.SchoolResponse;
import com.pasa.backend.mapper.SchoolMapper;
import com.pasa.backend.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class SchoolService {

    private final SchoolRepository schoolRepo;

    public SchoolService(SchoolRepository schoolRepo) {
        this.schoolRepo = schoolRepo;
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
        if (schoolRepo.existsByEmisNumber(req.emisNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EMIS number already registered");
        }
        School school = SchoolMapper.toEntity(req);
        return SchoolMapper.toResponse(schoolRepo.save(school));
    }

    public SchoolResponse updateSchool(UUID id, CreateSchoolRequest req) {
        School existing = schoolRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        existing.setName(req.name());
        existing.setEmisNumber(req.emisNumber());
        existing.setDistrict(req.district());
        existing.setProvince(req.province());
        existing.setPhase(req.phase());
        existing.setSchoolType(req.schoolType());
        existing.setCity(req.city());
        existing.setEmail(req.email());
        existing.setPhone(req.phone());
        return SchoolMapper.toResponse(schoolRepo.save(existing));
    }
}
