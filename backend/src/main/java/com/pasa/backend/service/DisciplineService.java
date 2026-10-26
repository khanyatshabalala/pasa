package com.pasa.backend.service;

import com.pasa.backend.domain.entity.DisciplineRecord;
import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.dto.request.CreateDisciplineRequest;
import com.pasa.backend.dto.response.DisciplineResponse;
import com.pasa.backend.mapper.DisciplineMapper;
import com.pasa.backend.repository.DisciplineRepository;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.security.LearnerAccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class DisciplineService {

    private final DisciplineRepository disciplineRepo;
    private final LearnerRepository learnerRepo;
    private final LearnerAccessGuard accessGuard;

    public DisciplineService(DisciplineRepository disciplineRepo, LearnerRepository learnerRepo,
                             LearnerAccessGuard accessGuard) {
        this.disciplineRepo = disciplineRepo;
        this.learnerRepo = learnerRepo;
        this.accessGuard = accessGuard;
    }

    public List<DisciplineResponse> getDiscipline(UUID learnerId, UUID userId) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanAccessLearner(learnerId, userId);
        return disciplineRepo.findByLearnerIdOrderByDateDesc(learnerId).stream()
                .map(DisciplineMapper::toResponse)
                .toList();
    }

    public List<DisciplineResponse> getDisciplineForSchool(UUID schoolId) {
        return disciplineRepo.findBySchoolIdOrderByDateDesc(schoolId).stream()
                .map(DisciplineMapper::toResponse)
                .toList();
    }

    public DisciplineResponse createRecord(UUID learnerId, CreateDisciplineRequest req, UUID userId) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanManageLearner(learnerId, userId);

        DisciplineRecord record = DisciplineMapper.toEntity(req);
        record.setLearner(learner);
        record.setRecordedBy(userId);
        return DisciplineMapper.toResponse(disciplineRepo.save(record));
    }

    public void deleteRecord(UUID id, UUID userId) {
        DisciplineRecord record = disciplineRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        accessGuard.assertCanManageLearner(record.getLearner().getId(), userId);
        disciplineRepo.delete(record);
    }
}
