package com.pasa.backend.reportcard;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "report_cards", schema = "public")
public class ReportCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "learner_id", nullable = false)
    private UUID learnerId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "academic_year", nullable = false)
    private Integer academicYear;

    @Column(nullable = false)
    private Integer term;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private OffsetDateTime uploadedAt;

    private String notes;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "file_purged_at")
    private OffsetDateTime filePurgedAt;

    public ReportCard() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getLearnerId() { return learnerId; }
    public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public Integer getAcademicYear() { return academicYear; }
    public void setAcademicYear(Integer academicYear) { this.academicYear = academicYear; }
    public Integer getTerm() { return term; }
    public void setTerm(Integer term) { this.term = term; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public UUID getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(UUID uploadedBy) { this.uploadedBy = uploadedBy; }
    public OffsetDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(OffsetDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(OffsetDateTime deletedAt) { this.deletedAt = deletedAt; }

    public OffsetDateTime getFilePurgedAt() { return filePurgedAt; }
    public void setFilePurgedAt(OffsetDateTime filePurgedAt) { this.filePurgedAt = filePurgedAt; }
}
