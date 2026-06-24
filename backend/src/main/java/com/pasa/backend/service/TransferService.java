package com.pasa.backend.service;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.domain.entity.Transfer;
import com.pasa.backend.domain.enums.TransferStatus;
import com.pasa.backend.dto.request.CreateTransferRequest;
import com.pasa.backend.dto.response.TransferResponse;
import com.pasa.backend.mapper.TransferMapper;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.repository.TransferRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TransferService {

    private final TransferRepository transferRepo;
    private final LearnerRepository learnerRepo;
    private final SchoolRepository schoolRepo;

    public TransferService(TransferRepository transferRepo, LearnerRepository learnerRepo, SchoolRepository schoolRepo) {
        this.transferRepo = transferRepo;
        this.learnerRepo = learnerRepo;
        this.schoolRepo = schoolRepo;
    }

    public List<TransferResponse> getBySchool(UUID schoolId) {
        return transferRepo.findByFromSchoolIdOrToSchoolId(schoolId, schoolId).stream()
                .map(TransferMapper::toResponse)
                .toList();
    }

    public List<TransferResponse> getByLearner(UUID learnerId) {
        return transferRepo.findByLearnerId(learnerId).stream()
                .map(TransferMapper::toResponse)
                .toList();
    }

    public TransferResponse requestTransfer(CreateTransferRequest req, UUID userId) {
        Learner learner = learnerRepo.findById(req.learnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        School fromSchool = schoolRepo.findById(req.fromSchoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "From school not found"));
        School toSchool = schoolRepo.findById(req.toSchoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "To school not found"));

        Transfer transfer = Transfer.create(learner, fromSchool, toSchool, req.reason(), TransferStatus.pending, userId);
        return TransferMapper.toResponse(transferRepo.save(transfer));
    }

    public TransferResponse updateStatus(UUID id, TransferStatus status, UUID userId) {
        Transfer transfer = transferRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer not found"));

        transfer.setStatus(status);
        transfer.setApprovedBy(userId);
        transfer.setResolvedAt(OffsetDateTime.now());
        return TransferMapper.toResponse(transferRepo.save(transfer));
    }
}
