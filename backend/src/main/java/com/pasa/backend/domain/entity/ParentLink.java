package com.pasa.backend.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "parent_links",
    schema = "public",
    uniqueConstraints = @UniqueConstraint(columnNames = {"parent_user_id", "learner_id"})
)
public class ParentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "parent_user_id", nullable = false)
    private UUID parentUserId;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(nullable = false)
    private String relationship;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public ParentLink() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getParentUserId() { return parentUserId; }
    public void setParentUserId(UUID parentUserId) { this.parentUserId = parentUserId; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
