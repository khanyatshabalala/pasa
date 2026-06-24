package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.dto.request.CreateSchoolRequest;
import com.pasa.backend.dto.response.SchoolResponse;

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
            school.getCreatedAt(),
            school.getUpdatedAt()
        );
    }

    public static School toEntity(CreateSchoolRequest req) {
        School school = new School();
        school.setName(req.name());
        school.setEmisNumber(req.emisNumber());
        school.setDistrict(req.district());
        school.setProvince(req.province());
        school.setPhase(req.phase());
        school.setSchoolType(req.schoolType());
        school.setCity(req.city());
        school.setEmail(req.email());
        school.setPhone(req.phone());
        return school;
    }
}
