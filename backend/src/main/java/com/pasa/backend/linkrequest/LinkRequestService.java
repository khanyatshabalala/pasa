package com.pasa.backend.linkrequest;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.ParentLink;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.ParentLinkRepository;
import com.pasa.backend.repository.SchoolRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LinkRequestService {

    private static final Logger log = LoggerFactory.getLogger(LinkRequestService.class);

    private final LinkRequestRepository linkRequestRepo;
    private final SchoolRepository schoolRepo;
    private final LearnerRepository learnerRepo;
    private final ParentLinkRepository parentLinkRepo;
    private final JdbcTemplate jdbc;

    public LinkRequestService(
            LinkRequestRepository linkRequestRepo,
            SchoolRepository schoolRepo,
            LearnerRepository learnerRepo,
            ParentLinkRepository parentLinkRepo,
            JdbcTemplate jdbc) {
        this.linkRequestRepo = linkRequestRepo;
        this.schoolRepo = schoolRepo;
        this.learnerRepo = learnerRepo;
        this.parentLinkRepo = parentLinkRepo;
        this.jdbc = jdbc;
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

    /**
     * Approve a link request.
     *
     * Behaviour:
     * 1. If a learner with the matching learner number already exists at the school,
     *    verify the name matches (case-insensitive) before proceeding.
     * 2. If no learner exists yet, create one from the request data. The school
     *    admin approving the request is vouching that the learner is genuine — this
     *    is the "auto-create on approval" path.
     * 3. Create a parent_link between the parent and the learner (idempotent — if
     *    the link already exists, skip it).
     * 4. Mark the request approved and notify the parent.
     */
    @Transactional
    public LinkRequestResponse approveRequest(UUID id, UUID reviewerId) {
        LinkRequest request = linkRequestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"pending".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already processed");
        }

        School school = request.getSchool();
        UUID schoolId = school.getId();

        // ── Step 1: find or create the learner ───────────────────────────────
        Optional<Learner> existing = learnerRepo.findBySchool_IdAndLearnerNumber(
                schoolId, request.getLearnerNumber().trim());

        Learner learner;
        if (existing.isPresent()) {
            learner = existing.get();
            // Verify name matches (case-insensitive) — same guard as the old Supabase function.
            String reqFirst = request.getFirstName().trim().toLowerCase();
            String reqLast  = request.getLastName().trim().toLowerCase();
            String dbFirst  = learner.getFirstName() == null ? "" : learner.getFirstName().trim().toLowerCase();
            String dbLast   = learner.getLastName()  == null ? "" : learner.getLastName().trim().toLowerCase();
            if (!reqFirst.equals(dbFirst) || !reqLast.equals(dbLast)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Name does not match school records. Please verify the learner's name.");
            }
            log.info("Approving link request {} — matched existing learner {}", id, learner.getId());
        } else {
            // Auto-create: the school admin's approval is the trust signal.
            learner = new Learner();
            learner.setSchool(school);
            learner.setFirstName(request.getFirstName().trim());
            learner.setLastName(request.getLastName().trim());
            learner.setLearnerNumber(request.getLearnerNumber().trim());
            learner = learnerRepo.save(learner);
            log.info("Approving link request {} — auto-created learner {}", id, learner.getId());
        }

        // ── Step 2: create parent link (idempotent) ───────────────────────────
        if (!parentLinkRepo.existsByParentUserIdAndLearnerId(request.getParentUserId(), learner.getId())) {
            boolean isFirstChild = !parentLinkRepo.existsByParentUserId(request.getParentUserId());
            ParentLink link = new ParentLink();
            link.setParentUserId(request.getParentUserId());
            link.setLearnerId(learner.getId());
            link.setRelationship(request.getRelationship() != null ? request.getRelationship() : "parent");
            link.setIsPrimary(isFirstChild);
            parentLinkRepo.save(link);
        }

        // ── Step 3: mark approved ─────────────────────────────────────────────
        request.setStatus("approved");
        request.setReviewedBy(reviewerId);
        request.setReviewedAt(OffsetDateTime.now());
        linkRequestRepo.save(request);

        // ── Step 4: notify parent ─────────────────────────────────────────────
        try {
            jdbc.update("""
                INSERT INTO public.notifications (user_id, title, body, category, link)
                VALUES (?, ?, ?, 'children', '/app/children')
                """,
                request.getParentUserId(),
                "✅ Child linked: " + learner.getFirstName() + " " + learner.getLastName(),
                "Your request to link " + learner.getFirstName() + " " + learner.getLastName()
                    + " at " + school.getName() + " has been approved."
            );
        } catch (Exception e) {
            // Notification is best-effort — don't roll back the approval if it fails.
            log.warn("Could not send approval notification for request {}", id, e);
        }

        return LinkRequestMapper.toResponse(request);
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
