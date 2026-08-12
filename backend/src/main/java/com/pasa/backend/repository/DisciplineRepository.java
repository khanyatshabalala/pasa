package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.DisciplineRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisciplineRepository extends JpaRepository<DisciplineRecord, UUID> {
    List<DisciplineRecord> findByLearnerIdOrderByDateDesc(UUID learnerId);

    @org.springframework.data.jpa.repository.Query("""
        SELECT d FROM DisciplineRecord d
        JOIN Learner l ON l.id = d.learner.id
        WHERE l.schoolId = :schoolId
        ORDER BY d.date DESC
        """)
    List<DisciplineRecord> findBySchoolIdOrderByDateDesc(UUID schoolId);
}
