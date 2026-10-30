package com.pasa.backend.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamTimetableRepository extends JpaRepository<ExamTimetable, UUID> {
    List<ExamTimetable> findBySchoolIdAndAcademicYearOrderByExamDateAsc(UUID schoolId, Integer academicYear);
    List<ExamTimetable> findBySchoolIdAndAcademicYearAndTermOrderByExamDateAsc(UUID schoolId, Integer academicYear, Integer term);
}
