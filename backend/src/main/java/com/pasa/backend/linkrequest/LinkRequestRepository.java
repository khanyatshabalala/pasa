package com.pasa.backend.linkrequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LinkRequestRepository extends JpaRepository<LinkRequest, UUID> {
    List<LinkRequest> findByParentUserId(UUID parentUserId);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM public.parent_link_requests
                WHERE parent_user_id = :parentId
                  AND school_id = :schoolId
                  AND learner_number = :learnerNumber
                  AND status IN ('pending', 'approved')
            )
            """, nativeQuery = true)
    boolean existsActiveRequest(
            @Param("parentId") UUID parentId,
            @Param("schoolId") UUID schoolId,
            @Param("learnerNumber") String learnerNumber);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM public.parent_link_requests
                WHERE parent_user_id = :parentId
                  AND school_id = :schoolId
                  AND learner_number = :learnerNumber
                  AND id <> :requestId
                  AND status IN ('pending', 'approved')
            )
            """, nativeQuery = true)
    boolean existsOtherActiveRequest(
            @Param("parentId") UUID parentId,
            @Param("schoolId") UUID schoolId,
            @Param("learnerNumber") String learnerNumber,
            @Param("requestId") UUID requestId);

    List<LinkRequest> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);

    @Query(value = """
            SELECT * FROM public.parent_link_requests
            WHERE school_id = :schoolId
              AND status = CAST(:status AS public.link_request_status)
            ORDER BY created_at DESC
            """, nativeQuery = true)
    List<LinkRequest> findBySchoolIdAndStatus(
            @Param("schoolId") UUID schoolId,
            @Param("status") String status);
}
