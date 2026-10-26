package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.ReportCard;
import com.pasa.backend.dto.response.ReportCardResponse;

public final class ReportCardMapper {

    private ReportCardMapper() {}

    public static ReportCardResponse toResponse(
            ReportCard rc,
            String uploadedByName,
            String learnerFirstName,
            String learnerLastName
    ) {
        return new ReportCardResponse(
            rc.getId(),
            rc.getLearnerId(),
            rc.getSchoolId(),
            rc.getAcademicYear(),
            rc.getTerm(),
            rc.getFileName(),
            rc.getUploadedBy(),
            uploadedByName,
            rc.getUploadedAt(),
            rc.getNotes(),
            learnerFirstName,
            learnerLastName
        );
    }
}
