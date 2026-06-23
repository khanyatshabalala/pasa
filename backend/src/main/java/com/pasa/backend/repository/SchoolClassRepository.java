package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, UUID> {
    List<SchoolClass> findBySchoolIdAndAcademicYear(UUID schoolId, Integer academicYear);
    List<SchoolClass> findByTeacherUserId(UUID teacherUserId);
}
