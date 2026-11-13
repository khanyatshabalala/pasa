package com.pasa.backend.learner;

import com.pasa.backend.domain.entity.Learner;

public final class LearnerMapper {

    private LearnerMapper() {}

    /**
     * Map to response. className is passed in by the service (which looks it up from
     * the SchoolClassRepository) so the mapper stays a pure data transformer with no
     * repository dependency.
     */
    public static LearnerResponse toResponse(Learner learner, String className) {
        return new LearnerResponse(
            learner.getId(),
            learner.getFirstName(),
            learner.getLastName(),
            learner.getDateOfBirth(),
            learner.getGradeId(),
            learner.getLearnerNumber(),
            learner.getGender(),
            learner.getSchool() != null ? learner.getSchool().getId() : null,
            learner.getSchool() != null ? learner.getSchool().getName() : null,
            learner.getClassId(),
            className
        );
    }

    /** Convenience overload for cases where the class name is not needed / not available. */
    public static LearnerResponse toResponse(Learner learner) {
        return toResponse(learner, null);
    }

    public static Learner toEntity(CreateLearnerRequest req) {
        Learner learner = new Learner();
        learner.setFirstName(req.firstName());
        learner.setLastName(req.lastName());
        learner.setDateOfBirth(req.dateOfBirth());
        learner.setGradeId(req.gradeId());
        learner.setLearnerNumber(req.learnerNumber());
        learner.setGender(req.gender());
        learner.setClassId(req.classId());
        return learner;
    }
}
