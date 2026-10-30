package com.pasa.backend.schoolclass;


public final class ClassMapper {

    private ClassMapper() {}

    public static ClassResponse toResponse(SchoolClass schoolClass) {
        return new ClassResponse(
            schoolClass.getId(),
            schoolClass.getName(),
            schoolClass.getGradeId(),
            schoolClass.getTeacherUserId(),
            schoolClass.getAcademicYear()
        );
    }

    public static SchoolClass toEntity(CreateClassRequest req) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setName(req.name());
        schoolClass.setGradeId(req.gradeId());
        schoolClass.setTeacherUserId(req.teacherUserId());
        schoolClass.setAcademicYear(req.academicYear());
        return schoolClass;
    }
}
