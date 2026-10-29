package com.pasa.backend.marks;

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
