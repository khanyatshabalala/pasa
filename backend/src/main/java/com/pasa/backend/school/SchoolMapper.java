package com.pasa.backend.school;

import com.pasa.backend.domain.entity.School;

public final class SchoolMapper {

    private SchoolMapper() {}

    public static SchoolResponse toResponse(School school) {
        return new SchoolResponse(
            school.getId(),
            school.getName(),
            school.getEmisNumber(),
            school.getDistrict(),
            school.getProvince(),
            school.getPhase(),
            school.getSchoolType(),
            school.getAddress(),
            school.getCity(),
            school.getPostalCode(),
            school.getPhone(),
            school.getEmail(),
            school.getWebsite(),
            school.getPrincipalName(),
            school.getEstablishedYear(),
            school.getLearnerCount(),
            school.getFeesAnnual(),
            school.getLogoUrl(),
            school.getMotto(),
            school.getDescription(),
            school.getDistrictId(),
            school.getGradeFrom(),
            school.getGradeTo(),
            school.getApplicationOpen(),
            school.getApplicationClose(),
            school.getAdmissionRequirements(),
            school.getApplicationContact(),
            school.getPerformanceAvg(),
            school.getPerformanceRankDistrict(),
            school.getPerformanceRankProvince(),
            school.getPerformanceRankNational(),
            school.getCreatedAt(),
            school.getUpdatedAt()
        );
    }

    public static School toEntity(CreateSchoolRequest req) {
        School school = new School();
        applyRequest(school, req);
        return school;
    }

    /** Copy all mutable (non-performance) fields from the request onto the entity. */
    public static void applyRequest(School school, CreateSchoolRequest req) {
        school.setName(req.name());
        school.setEmisNumber(req.emisNumber());
        school.setDistrict(req.district());
        school.setProvince(req.province());
        school.setPhase(req.phase());
        school.setSchoolType(req.schoolType());
        school.setCity(req.city());
        school.setEmail(req.email());
        school.setPhone(req.phone());
        school.setDistrictId(req.districtId());
        school.setGradeFrom(req.gradeFrom());
        school.setGradeTo(req.gradeTo());
        school.setApplicationOpen(req.applicationOpen());
        school.setApplicationClose(req.applicationClose());
        school.setAdmissionRequirements(req.admissionRequirements());
        school.setApplicationContact(req.applicationContact());
    }
}
