package com.pasa.backend.service;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.dto.request.CreateLearnerRequest;
import com.pasa.backend.dto.response.LearnerResponse;
import com.pasa.backend.mapper.LearnerMapper;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.security.LearnerAccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class LearnerService {

    private final LearnerRepository learnerRepo;
    private final SchoolRepository schoolRepo;
    private final LearnerAccessGuard accessGuard;

    public LearnerService(LearnerRepository learnerRepo, SchoolRepository schoolRepo,
                          LearnerAccessGuard accessGuard) {
        this.learnerRepo = learnerRepo;
        this.schoolRepo = schoolRepo;
        this.accessGuard = accessGuard;
    }

    public List<LearnerResponse> getMyChildren(UUID parentId) {
        return learnerRepo.findByParentUserId(parentId).stream()
                .map(LearnerMapper::toResponse)
                .toList();
    }

    public List<LearnerResponse> getLearnersBySchool(UUID schoolId) {
        if (!schoolRepo.existsById(schoolId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found");
        }
        return learnerRepo.findBySchoolId(schoolId).stream()
                .map(LearnerMapper::toResponse)
                .toList();
    }

    public LearnerResponse getLearner(UUID id, UUID userId) {
        Learner learner = learnerRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanAccessLearner(id, userId);
        return LearnerMapper.toResponse(learner);
    }

    public LearnerResponse createLearner(UUID schoolId, CreateLearnerRequest req) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        Learner learner = LearnerMapper.toEntity(req);
        learner.setSchool(school);
        return LearnerMapper.toResponse(learnerRepo.save(learner));
    }

    public LearnerResponse updateLearner(UUID id, CreateLearnerRequest req) {
        Learner existing = learnerRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        existing.setFirstName(req.firstName());
        existing.setLastName(req.lastName());
        existing.setDateOfBirth(req.dateOfBirth());
        existing.setGradeId(req.gradeId());
        existing.setLearnerNumber(req.learnerNumber());
        existing.setGender(req.gender());
        return LearnerMapper.toResponse(learnerRepo.save(existing));
    }
}
