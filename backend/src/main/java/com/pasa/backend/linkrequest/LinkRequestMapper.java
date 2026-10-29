package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.LinkRequest;
import com.pasa.backend.dto.response.LinkRequestResponse;

public final class LinkRequestMapper {

    private LinkRequestMapper() {}

    public static LinkRequestResponse toResponse(LinkRequest request) {
        return new LinkRequestResponse(
            request.getId(),
            request.getParentUserId(),
            request.getSchool() != null ? request.getSchool().getId() : null,
            request.getSchool() != null ? request.getSchool().getName() : null,
            request.getLearnerNumber(),
            request.getFirstName(),
            request.getLastName(),
            request.getRelationship(),
            request.getStatus(),
            request.getCreatedAt()
        );
    }
}
