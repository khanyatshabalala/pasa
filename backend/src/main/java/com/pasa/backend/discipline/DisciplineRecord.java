package com.pasa.backend.discipline;

import com.pasa.backend.domain.entity.Learner;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "discipline_records", schema = "public")
public class DisciplineRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "discipline_type")
    private DisciplineType type;

    @Column(nullable = false)
    private String title;

    private String description;

    private Integer points;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "recorded_by")
    private UUID recordedBy;

    @CreationTimestamp
    @Column(name = "recorded_at", updatable = false)
    private OffsetDateTime recordedAt;

    public DisciplineRecord() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }
    public DisciplineType getType() { return type; }
    public void setType(DisciplineType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public UUID getRecordedBy() { return recordedBy; }
    public void setRecordedBy(UUID recordedBy) { this.recordedBy = recordedBy; }
    public OffsetDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(OffsetDateTime recordedAt) { this.recordedAt = recordedAt; }
}
