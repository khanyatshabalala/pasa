package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.Learner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearnerRepository extends JpaRepository<Learner, UUID> {
    List<Learner> findBySchoolId(UUID schoolId);
    List<Learner> findBySchoolIdAndGradeId(UUID schoolId, Integer gradeId);

    // Learners linked to a parent via parent_links table
    @Query("""
        SELECT l FROM Learner l
        JOIN ParentLink pl ON pl.learnerId = l.id
        WHERE pl.parentUserId = :parentUserId
        """)
    List<Learner> findByParentUserId(UUID parentUserId);
}
