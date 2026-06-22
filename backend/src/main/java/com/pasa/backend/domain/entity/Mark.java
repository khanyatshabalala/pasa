package com.pasa.backend.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "marks", schema = "public")
public class Mark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;

    @Column(name = "assessment_name", nullable = false)
    private String assessmentName;

    @Column(nullable = false)
    private Integer term;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "max_score", precision = 5, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "class_average", precision = 5, scale = 2)
    private BigDecimal classAverage;

    @Column(name = "recorded_by")
    private UUID recordedBy;

    @CreationTimestamp
    @Column(name = "recorded_at", updatable = false)
    private OffsetDateTime recordedAt;

    public Mark() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public String getAssessmentName() { return assessmentName; }
    public void setAssessmentName(String assessmentName) { this.assessmentName = assessmentName; }
    public Integer getTerm() { return term; }
    public void setTerm(Integer term) { this.term = term; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public BigDecimal getClassAverage() { return classAverage; }
    public void setClassAverage(BigDecimal classAverage) { this.classAverage = classAverage; }
    public UUID getRecordedBy() { return recordedBy; }
    public void setRecordedBy(UUID recordedBy) { this.recordedBy = recordedBy; }
    public OffsetDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(OffsetDateTime recordedAt) { this.recordedAt = recordedAt; }
}
