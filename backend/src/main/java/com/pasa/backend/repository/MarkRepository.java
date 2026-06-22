package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.Mark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MarkRepository extends JpaRepository<Mark, UUID> {
    List<Mark> findByLearnerIdOrderByRecordedAtDesc(UUID learnerId);
    List<Mark> findByLearnerIdAndTerm(UUID learnerId, Integer term);
    List<Mark> findByLearnerIdAndSubjectId(UUID learnerId, UUID subjectId);
}
