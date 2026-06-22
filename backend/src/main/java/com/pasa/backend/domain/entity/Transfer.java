package com.pasa.backend.domain.entity;

import com.pasa.backend.domain.enums.TransferStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "transfers", schema = "public")
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_school_id", nullable = false)
    private School fromSchool;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_school_id", nullable = false)
    private School toSchool;

    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "transfer_status")
    private TransferStatus status;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @CreationTimestamp
    @Column(name = "requested_at", updatable = false)
    private OffsetDateTime requestedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    public Transfer() {}

    // Builder-style static factory
    public static Transfer create(Learner learner, School fromSchool, School toSchool,
                                   String reason, TransferStatus status, UUID requestedBy) {
        Transfer t = new Transfer();
        t.learner = learner;
        t.fromSchool = fromSchool;
        t.toSchool = toSchool;
        t.reason = reason;
        t.status = status;
        t.requestedBy = requestedBy;
        return t;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }
    public School getFromSchool() { return fromSchool; }
    public void setFromSchool(School fromSchool) { this.fromSchool = fromSchool; }
    public School getToSchool() { return toSchool; }
    public void setToSchool(School toSchool) { this.toSchool = toSchool; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public TransferStatus getStatus() { return status; }
    public void setStatus(TransferStatus status) { this.status = status; }
    public UUID getRequestedBy() { return requestedBy; }
    public void setRequestedBy(UUID requestedBy) { this.requestedBy = requestedBy; }
    public UUID getApprovedBy() { return approvedBy; }
    public void setApprovedBy(UUID approvedBy) { this.approvedBy = approvedBy; }
    public OffsetDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(OffsetDateTime requestedAt) { this.requestedAt = requestedAt; }
    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
