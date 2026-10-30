package com.pasa.backend.linkrequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LinkRequestRepository extends JpaRepository<LinkRequest, UUID> {
    List<LinkRequest> findByParentUserId(UUID parentUserId);
    List<LinkRequest> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    List<LinkRequest> findBySchoolIdAndStatus(UUID schoolId, String status);
}
