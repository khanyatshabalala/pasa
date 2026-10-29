package com.pasa.backend.discipline;

public final class DisciplineMapper {

    private DisciplineMapper() {}

    public static DisciplineResponse toResponse(DisciplineRecord record) {
        return new DisciplineResponse(
            record.getId(),
            record.getLearner() != null ? record.getLearner().getId() : null,
            record.getType(),
            record.getTitle(),
            record.getDescription(),
            record.getPoints(),
            record.getDate()
        );
    }

    public static DisciplineRecord toEntity(CreateDisciplineRequest req) {
        DisciplineRecord record = new DisciplineRecord();
        record.setType(req.type());
        record.setTitle(req.title());
        record.setDescription(req.description());
        record.setPoints(req.points());
        record.setDate(req.date());
        return record;
    }
}
