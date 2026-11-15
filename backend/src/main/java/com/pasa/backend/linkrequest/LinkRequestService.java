package com.pasa.backend.linkrequest;

import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.domain.entity.ParentLink;
import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.ParentLinkRepository;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.schoolclass.SchoolClassRepository;
import com.pasa.backend.security.SchoolAccessGuard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class LinkRequestService {

    private static final Logger log = LoggerFactory.getLogger(LinkRequestService.class);

    private final LinkRequestRepository linkRequestRepo;
    private final SchoolRepository schoolRepo;
    private final LearnerRepository learnerRepo;
    private final ParentLinkRepository parentLinkRepo;
    private final SchoolClassRepository classRepo;
    private final JdbcTemplate jdbc;
    private final SchoolAccessGuard schoolAccessGuard;

    public LinkRequestService(
            LinkRequestRepository linkRequestRepo,
            SchoolRepository schoolRepo,
            LearnerRepository learnerRepo,
            ParentLinkRepository parentLinkRepo,
            SchoolClassRepository classRepo,
            JdbcTemplate jdbc,
            SchoolAccessGuard schoolAccessGuard) {
        this.linkRequestRepo = linkRequestRepo;
        this.schoolRepo = schoolRepo;
        this.learnerRepo = learnerRepo;
        this.parentLinkRepo = parentLinkRepo;
        this.classRepo = classRepo;
        this.jdbc = jdbc;
        this.schoolAccessGuard = schoolAccessGuard;
    }

    public List<LinkRequestResponse> getMyRequests(UUID parentId) {
        return linkRequestRepo.findByParentUserId(parentId).stream()
                .map(LinkRequestMapper::toResponse)
                .toList();
    }

    public LinkRequestResponse submitRequest(SubmitLinkRequest req, UUID parentId) {
        School school = validateRequestDetails(req, parentId, null);
        OffsetDateTime now = OffsetDateTime.now();
        LinkRequest request = new LinkRequest();
        request.setParentUserId(parentId);
        applyRequestDetails(request, req, school);
        request.setStatus("pending");
        request.setUpdatedAt(now);
        return LinkRequestMapper.toResponse(linkRequestRepo.save(request));
    }

    @Transactional
    public LinkRequestResponse updateRequest(UUID id, SubmitLinkRequest req, UUID parentId) {
        LinkRequest request = getPendingParentRequest(id, parentId);
        School school = validateRequestDetails(req, parentId, id);
        applyRequestDetails(request, req, school);
        request.setUpdatedAt(OffsetDateTime.now());
        return LinkRequestMapper.toResponse(linkRequestRepo.save(request));
    }

    @Transactional
    public LinkRequestResponse withdrawRequest(UUID id, UUID parentId) {
        LinkRequest request = getPendingParentRequest(id, parentId);
        OffsetDateTime now = OffsetDateTime.now();
        request.setStatus("withdrawn");
        request.setWithdrawnAt(now);
        request.setUpdatedAt(now);
        return LinkRequestMapper.toResponse(linkRequestRepo.save(request));
    }

    private LinkRequest getPendingParentRequest(UUID id, UUID parentId) {
        LinkRequest request = linkRequestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!request.getParentUserId().equals(parentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found");
        }
        if (!"pending".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending requests can be changed");
        }
        return request;
    }

    private School validateRequestDetails(SubmitLinkRequest req, UUID parentId, UUID requestId) {
        School school = schoolRepo.findById(req.schoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        int gradeFrom = school.getGradeFrom() != null ? school.getGradeFrom() : defaultGradeFrom(school);
        int gradeTo = school.getGradeTo() != null ? school.getGradeTo() : defaultGradeTo(school);
        if (req.gradeId() < gradeFrom || req.gradeId() > gradeTo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected grade is not offered by this school");
        }
        if (req.classId() != null) {
            var schoolClass = classRepo.findById(req.classId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found"));
            if (!schoolClass.getSchool().getId().equals(school.getId())
                    || !schoolClass.getGradeId().equals(req.gradeId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class must belong to the selected school and grade");
            }
        }
        String learnerNumber = req.learnerNumber().trim();
        boolean duplicate = requestId == null
                ? linkRequestRepo.existsActiveRequest(parentId, school.getId(), learnerNumber)
                : linkRequestRepo.existsOtherActiveRequest(parentId, school.getId(), learnerNumber, requestId);
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already submitted for this learner");
        }
        return school;
    }

    private void applyRequestDetails(LinkRequest request, SubmitLinkRequest req, School school) {
        request.setSchool(school);
        request.setLearnerNumber(req.learnerNumber().trim());
        request.setFirstName(req.firstName().trim());
        request.setLastName(req.lastName().trim());
        request.setRelationship(req.relationship() != null ? req.relationship() : "parent");
        request.setGradeId(req.gradeId());
        request.setClassId(req.classId());
    }

    private int defaultGradeFrom(School school) {
        return switch (school.getPhase()) {
            case primary, combined -> 0;
            case secondary -> 8;
            case ecd -> 0;
        };
    }

    private int defaultGradeTo(School school) {
        return switch (school.getPhase()) {
            case primary -> 7;
            case secondary, combined -> 12;
            case ecd -> 0;
        };
    }

    public List<LinkRequestResponse> getSchoolRequests(UUID schoolId, String status, UUID reviewerId) {
        schoolAccessGuard.assertCanManageSchool(schoolId, reviewerId);
        List<LinkRequest> requests;
        if (status != null) {
            requests = linkRequestRepo.findBySchoolIdAndStatus(schoolId, status);
        } else {
            requests = linkRequestRepo.findBySchoolIdOrderByCreatedAtDesc(schoolId);
        }
        Map<UUID, String> parentNames = new HashMap<>();
        for (Map<String, Object> row : jdbc.queryForList("""
                SELECT DISTINCT lr.parent_user_id, p.full_name
                FROM public.parent_link_requests lr
                LEFT JOIN public.profiles p ON p.id = lr.parent_user_id
                WHERE lr.school_id = ?
                """, schoolId)) {
            if (row.get("full_name") != null) {
                parentNames.put(UUID.fromString(row.get("parent_user_id").toString()), row.get("full_name").toString());
            }
        }
        return requests.stream()
                .map(request -> LinkRequestMapper.toResponse(request, parentNames.get(request.getParentUserId())))
                .toList();
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
        schoolAccessGuard.assertCanManageSchool(schoolId, reviewerId);

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
            // Use grade/class supplied by the parent if available.
            Integer gradeId = request.getGradeId();
            UUID classId = request.getClassId();
            if (classId != null) {
                var schoolClass = classRepo.findById(classId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found"));
                if (!schoolClass.getSchool().getId().equals(schoolId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class must belong to this school");
                }
                if (gradeId == null) gradeId = schoolClass.getGradeId();
            }
            learner.setGradeId(gradeId);
            learner.setClassId(classId);
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
        schoolAccessGuard.assertCanManageSchool(request.getSchool().getId(), reviewerId);
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
