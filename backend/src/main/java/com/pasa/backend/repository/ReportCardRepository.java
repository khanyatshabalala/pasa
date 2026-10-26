package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.ReportCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportCardRepository extends JpaRepository<ReportCard, UUID> {

    List<ReportCard> findByLearnerIdOrderByAcademicYearDescTermDesc(UUID learnerId);

    List<ReportCard> findBySchoolIdOrderByAcademicYearDescTermDesc(UUID schoolId);

    Optional<ReportCard> findByLearnerIdAndAcademicYearAndTerm(UUID learnerId, Integer academicYear, Integer term);
}
