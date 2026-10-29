package com.pasa.backend.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParentSubscriptionRepository extends JpaRepository<ParentSubscription, UUID> {

    Optional<ParentSubscription> findByParentUserId(UUID parentUserId);

    /**
     * Query for parents who let their premium subscription lapse and are now past the 90-day grace.
     * Used by the retention cleanup job to downgrade them back to free.
     */
    @Query(nativeQuery = true, value = """
        SELECT * FROM public.parent_subscriptions
        WHERE tier = 'PREMIUM'
          AND subscription_ended_at IS NOT NULL
          AND subscription_ended_at + INTERVAL '90 days' < now()
    """)
    java.util.List<ParentSubscription> findLapsedPremiumBeyondGrace();
}
