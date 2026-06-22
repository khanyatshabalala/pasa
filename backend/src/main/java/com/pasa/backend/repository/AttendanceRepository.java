package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    List<Attendance> findByLearnerIdOrderByDateDesc(UUID learnerId);
    List<Attendance> findByLearnerIdAndDateBetweenOrderByDateDesc(UUID learnerId, LocalDate from, LocalDate to);
    Optional<Attendance> findByLearnerIdAndDate(UUID learnerId, LocalDate date);
    boolean existsByLearnerIdAndDate(UUID learnerId, LocalDate date);
}
