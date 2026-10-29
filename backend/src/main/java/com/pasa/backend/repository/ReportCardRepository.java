package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.ReportCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportCardRepository extends JpaRepository<ReportCard, UUID> {

    // ── Reader queries: exclude soft-deleted reports (retention) ──────────
    // Parents and schools only ever see live reports; the "...IncludingDeleted"
    // variants below are for the upload upsert and admin/retention paths.

    List<ReportCard> findByLearnerIdAndDeletedAtIsNullOrderByAcademicYearDescTermDesc(UUID learnerId);

    List<ReportCard> findBySchoolIdAndDeletedAtIsNullOrderByAcademicYearDescTermDesc(UUID schoolId);

    // ── Upsert lookup: find the slot even if previously soft-deleted, so a
    //    re-upload of the same year/term revives the existing row. ─────────
    Optional<ReportCard> findByLearnerIdAndAcademicYearAndTerm(UUID learnerId, Integer academicYear, Integer term);

    // ── Purge pass: soft-deleted rows whose backing storage file is not yet removed. ──
    List<ReportCard> findTop500ByDeletedAtIsNotNullAndFilePurgedAtIsNull();
}
