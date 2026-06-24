package com.pasa.backend.service;

import com.pasa.backend.domain.entity.LinkRequest;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.dto.request.RejectRequest;
import com.pasa.backend.dto.request.SubmitLinkRequest;
import com.pasa.backend.dto.response.LinkRequestResponse;
import com.pasa.backend.mapper.LinkRequestMapper;
import com.pasa.backend.repository.LinkRequestRepository;
import com.pasa.backend.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class LinkRequestService {

    private final LinkRequestRepository linkRequestRepo;
    private final SchoolRepository schoolRepo;

    public LinkRequestService(LinkRequestRepository linkRequestRepo, SchoolRepository schoolRepo) {
        this.linkRequestRepo = linkRequestRepo;
        this.schoolRepo = schoolRepo;
    }

    public List<LinkRequestResponse> getMyRequests(UUID parentId) {
        return linkRequestRepo.findByParentUserId(parentId).stream()
                .map(LinkRequestMapper::toResponse)
                .toList();
    }

    public LinkRequestResponse submitRequest(SubmitLinkRequest req, UUID parentId) {
        School school = schoolRepo.findById(req.schoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));

        LinkRequest request = new LinkRequest();
        request.setParentUserId(parentId);
        request.setSchool(school);
        request.setLearnerNumber(req.learnerNumber());
        request.setFirstName(req.firstName());
        request.setLastName(req.lastName());
        request.setRelationship(req.relationship() != null ? req.relationship() : "parent");
        request.setStatus("pending");

        return LinkRequestMapper.toResponse(linkRequestRepo.save(request));
    }

    public List<LinkRequestResponse> getSchoolRequests(UUID schoolId, String status) {
        List<LinkRequest> requests;
        if (status != null) {
            requests = linkRequestRepo.findBySchoolIdAndStatus(schoolId, status);
        } else {
            requests = linkRequestRepo.findBySchoolIdOrderByCreatedAtDesc(schoolId);
        }
        return requests.stream().map(LinkRequestMapper::toResponse).toList();
    }

    public LinkRequestResponse approveRequest(UUID id, UUID reviewerId) {
        LinkRequest request = linkRequestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"pending".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already processed");
        }
        request.setStatus("approved");
        request.setReviewedBy(reviewerId);
        request.setReviewedAt(OffsetDateTime.now());
        return LinkRequestMapper.toResponse(linkRequestRepo.save(request));
    }

    public LinkRequestResponse rejectRequest(UUID id, RejectRequest body, UUID reviewerId) {
        LinkRequest request = linkRequestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"pending".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already processed");
        }
        request.setStatus("rejected");
        request.setReviewedBy(reviewerId);
        request.setReviewedAt(OffsetDateTime.now());
        if (body != null) {
            request.setRejectionReason(body.reason());
        }
        return LinkRequestMapper.toResponse(linkRequestRepo.save(request));
    }
}
