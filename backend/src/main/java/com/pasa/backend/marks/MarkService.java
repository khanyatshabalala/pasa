package com.pasa.backend.marks;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.security.LearnerAccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class MarkService {

    private final MarkRepository markRepo;
    private final LearnerRepository learnerRepo;
    private final LearnerAccessGuard accessGuard;

    public MarkService(MarkRepository markRepo, LearnerRepository learnerRepo,
                       LearnerAccessGuard accessGuard) {
        this.markRepo = markRepo;
        this.learnerRepo = learnerRepo;
        this.accessGuard = accessGuard;
    }

    public List<MarkResponse> getMarks(UUID learnerId, Integer term, UUID userId) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanAccessLearner(learnerId, userId);

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
        accessGuard.assertCanManageLearner(learnerId, userId);

        Mark mark = MarkMapper.toEntity(req);
        mark.setLearner(learner);
        mark.setRecordedBy(userId);
        return MarkMapper.toResponse(markRepo.save(mark));
    }

    public MarkResponse updateMark(UUID id, RecordMarkRequest req, UUID userId) {
        Mark existing = markRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mark not found"));
        accessGuard.assertCanManageLearner(existing.getLearner().getId(), userId);

        existing.setSubjectId(req.subjectId());
        existing.setAssessmentName(req.assessmentName());
        existing.setTerm(req.term());
        existing.setScore(req.score());
        existing.setMaxScore(req.maxScore());
        existing.setRecordedBy(userId);
        return MarkMapper.toResponse(markRepo.save(existing));
    }
}
