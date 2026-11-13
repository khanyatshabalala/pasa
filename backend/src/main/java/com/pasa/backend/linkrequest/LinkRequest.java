package com.pasa.backend.linkrequest;

import com.pasa.backend.domain.entity.School;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "parent_link_requests",
    schema = "public",
    uniqueConstraints = @UniqueConstraint(columnNames = {"parent_user_id", "school_id", "learner_number"})
)
public class LinkRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "parent_user_id", nullable = false)
    private UUID parentUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "learner_number", nullable = false)
    private String learnerNumber;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String relationship;

    // pending | approved | rejected — stored as Postgres native enum link_request_status
    @Column(nullable = false, columnDefinition = "link_request_status")
    private String status;

    /** Grade provided by the parent. Used when auto-creating a learner on approval. */
    @Column(name = "grade_id")
    private Integer gradeId;

    /** Class provided by the parent (e.g. 10A). Used when auto-creating a learner on approval. */
    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public LinkRequest() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getParentUserId() { return parentUserId; }
    public void setParentUserId(UUID parentUserId) { this.parentUserId = parentUserId; }
    public School getSchool() { return school; }
    public void setSchool(School school) { this.school = school; }
    public String getLearnerNumber() { return learnerNumber; }
    public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getGradeId() { return gradeId; }
    public void setGradeId(Integer gradeId) { this.gradeId = gradeId; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(UUID reviewedBy) { this.reviewedBy = reviewedBy; }
    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
