package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.ParentLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParentLinkRepository extends JpaRepository<ParentLink, UUID> {

    boolean existsByParentUserId(UUID parentUserId);

    boolean existsByParentUserIdAndLearnerId(UUID parentUserId, UUID learnerId);

    Optional<ParentLink> findByParentUserIdAndLearnerId(UUID parentUserId, UUID learnerId);
}
