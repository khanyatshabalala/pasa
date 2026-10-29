package com.pasa.backend.transfer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, UUID> {
    List<Transfer> findByLearnerId(UUID learnerId);
    List<Transfer> findByFromSchoolIdOrToSchoolId(UUID fromSchoolId, UUID toSchoolId);
    List<Transfer> findByStatus(TransferStatus status);
}
