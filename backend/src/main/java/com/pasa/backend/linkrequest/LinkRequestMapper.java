package com.pasa.backend.linkrequest;

public final class LinkRequestMapper {

    private LinkRequestMapper() {}

    public static LinkRequestResponse toResponse(LinkRequest request) {
        return toResponse(request, null);
    }

    public static LinkRequestResponse toResponse(LinkRequest request, String parentName) {
        return new LinkRequestResponse(
            request.getId(),
            request.getParentUserId(),
            parentName,
            request.getSchool() != null ? request.getSchool().getId() : null,
            request.getSchool() != null ? request.getSchool().getName() : null,
            request.getLearnerNumber(),
            request.getFirstName(),
            request.getLastName(),
            request.getGradeId(),
            request.getClassId(),
            request.getRelationship(),
            request.getStatus(),
            request.getCreatedAt(),
            request.getRejectionReason()
        );
    }
}
