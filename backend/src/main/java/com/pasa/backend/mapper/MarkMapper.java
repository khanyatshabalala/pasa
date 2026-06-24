package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.Mark;
import com.pasa.backend.dto.request.RecordMarkRequest;
import com.pasa.backend.dto.response.MarkResponse;

public final class MarkMapper {

    private MarkMapper() {}

    public static MarkResponse toResponse(Mark mark) {
        return new MarkResponse(
            mark.getId(),
            mark.getLearner() != null ? mark.getLearner().getId() : null,
            mark.getSubjectId(),
            mark.getAssessmentName(),
            mark.getTerm(),
            mark.getScore(),
            mark.getMaxScore(),
            mark.getClassAverage()
        );
    }

    public static Mark toEntity(RecordMarkRequest req) {
        Mark mark = new Mark();
        mark.setSubjectId(req.subjectId());
        mark.setAssessmentName(req.assessmentName());
        mark.setTerm(req.term());
        mark.setScore(req.score());
        mark.setMaxScore(req.maxScore());
        return mark;
    }
}
