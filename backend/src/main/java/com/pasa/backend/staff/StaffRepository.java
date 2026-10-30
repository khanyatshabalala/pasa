package com.pasa.backend.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffRepository extends JpaRepository<Staff, UUID> {
    List<Staff> findBySchoolId(UUID schoolId);
    Optional<Staff> findByUserIdAndSchoolId(UUID userId, UUID schoolId);
}
