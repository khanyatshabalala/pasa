package com.pasa.backend.service;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.Mark;
import com.pasa.backend.dto.request.RecordMarkRequest;
import com.pasa.backend.dto.response.MarkResponse;
import com.pasa.backend.mapper.MarkMapper;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.MarkRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class MarkService {

    private final MarkRepository markRepo;
    private final LearnerRepository learnerRepo;

    public MarkService(MarkRepository markRepo, LearnerRepository learnerRepo) {
        this.markRepo = markRepo;
        this.learnerRepo = learnerRepo;
    }

    public List<MarkResponse> getMarks(UUID learnerId, Integer term) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        List<Mark> marks;
        if (term != null) {
            marks = markRepo.findByLearnerIdAndTerm(learnerId, term);
        } else {
            marks = markRepo.findByLearnerIdOrderByRecordedAtDesc(learnerId);
        }
        return marks.stream().map(MarkMapper::toResponse).toList();
    }

    public MarkResponse recordMark(UUID learnerId, RecordMarkRequest req, UUID userId) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        Mark mark = MarkMapper.toEntity(req);
        mark.setLearner(learner);
        mark.setRecordedBy(userId);
        return MarkMapper.toResponse(markRepo.save(mark));
    }

    public MarkResponse updateMark(UUID id, RecordMarkRequest req, UUID userId) {
        Mark existing = markRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mark not found"));

        existing.setSubjectId(req.subjectId());
        existing.setAssessmentName(req.assessmentName());
        existing.setTerm(req.term());
        existing.setScore(req.score());
        existing.setMaxScore(req.maxScore());
        existing.setRecordedBy(userId);
        return MarkMapper.toResponse(markRepo.save(existing));
    }
}
