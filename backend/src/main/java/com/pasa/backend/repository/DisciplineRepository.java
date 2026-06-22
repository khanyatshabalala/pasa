package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.DisciplineRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisciplineRepository extends JpaRepository<DisciplineRecord, UUID> {
    List<DisciplineRecord> findByLearnerIdOrderByDateDesc(UUID learnerId);
}
