package com.pasa.backend.service;

import com.pasa.backend.domain.entity.DisciplineRecord;
import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.dto.request.CreateDisciplineRequest;
import com.pasa.backend.dto.response.DisciplineResponse;
import com.pasa.backend.mapper.DisciplineMapper;
import com.pasa.backend.repository.DisciplineRepository;
import com.pasa.backend.repository.LearnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class DisciplineService {

    private final DisciplineRepository disciplineRepo;
    private final LearnerRepository learnerRepo;

    public DisciplineService(DisciplineRepository disciplineRepo, LearnerRepository learnerRepo) {
        this.disciplineRepo = disciplineRepo;
        this.learnerRepo = learnerRepo;
    }

    public List<DisciplineResponse> getDiscipline(UUID learnerId) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        return disciplineRepo.findByLearnerIdOrderByDateDesc(learnerId).stream()
                .map(DisciplineMapper::toResponse)
                .toList();
    }

    public DisciplineResponse createRecord(UUID learnerId, CreateDisciplineRequest req, UUID userId) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        DisciplineRecord record = DisciplineMapper.toEntity(req);
        record.setLearner(learner);
        record.setRecordedBy(userId);
        return DisciplineMapper.toResponse(disciplineRepo.save(record));
    }

    public void deleteRecord(UUID id) {
        DisciplineRecord record = disciplineRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        disciplineRepo.delete(record);
    }
}
