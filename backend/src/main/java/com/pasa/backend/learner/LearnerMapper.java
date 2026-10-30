package com.pasa.backend.learner;

import com.pasa.backend.domain.entity.Learner;

public final class LearnerMapper {

    private LearnerMapper() {}

    public static LearnerResponse toResponse(Learner learner) {
        return new LearnerResponse(
            learner.getId(),
            learner.getFirstName(),
            learner.getLastName(),
            learner.getDateOfBirth(),
            learner.getGradeId(),
            learner.getLearnerNumber(),
            learner.getGender(),
            learner.getSchool() != null ? learner.getSchool().getId() : null,
            learner.getSchool() != null ? learner.getSchool().getName() : null
        );
    }

    public static Learner toEntity(CreateLearnerRequest req) {
        Learner learner = new Learner();
        learner.setFirstName(req.firstName());
        learner.setLastName(req.lastName());
        learner.setDateOfBirth(req.dateOfBirth());
        learner.setGradeId(req.gradeId());
        learner.setLearnerNumber(req.learnerNumber());
        learner.setGender(req.gender());
        return learner;
    }
}
