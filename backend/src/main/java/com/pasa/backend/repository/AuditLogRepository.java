package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId, Pageable pageable);
    Page<AuditLog> findByActorUserIdOrderByCreatedAtDesc(UUID actorUserId, Pageable pageable);
    Page<AuditLog> findBySchoolIdAndActionOrderByCreatedAtDesc(UUID schoolId, String action, Pageable pageable);
}
