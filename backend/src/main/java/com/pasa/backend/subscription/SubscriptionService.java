package com.pasa.backend.subscription;

import com.pasa.backend.subscription.ParentSubscription.SubscriptionTier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Manages parent subscription tier changes, billing dates, and grace periods.
 * 
 * Pricing: R50/month for premium tier.
 * 
 * Not exposed in frontend until subscription launch date is decided.
 */
@Slf4j
@Service
public class SubscriptionService {

    private final ParentSubscriptionRepository subscriptionRepo;
    
    private static final String PREMIUM_PRICE_ZAR = "R50";

    public SubscriptionService(ParentSubscriptionRepository subscriptionRepo) {
        this.subscriptionRepo = subscriptionRepo;
    }

    /**
     * Get or create a subscription record for a parent (defaults to free tier).
     */
    public ParentSubscription getOrCreateSubscription(UUID parentUserId) {
        return subscriptionRepo.findByParentUserId(parentUserId)
            .orElseGet(() -> {
                ParentSubscription sub = new ParentSubscription(parentUserId);
                return subscriptionRepo.save(sub);
            });
    }

    /**
     * Upgrade a parent to premium tier and record the first subscription date + payment.
     * Idempotent: if already premium with active subscription, updates payment date only.
     */
    @Transactional
    public ParentSubscription upgradeToPremium(UUID parentUserId) {
        ParentSubscription sub = getOrCreateSubscription(parentUserId);
        
        if (sub.getTier() != SubscriptionTier.PREMIUM) {
            sub.setTier(SubscriptionTier.PREMIUM);
            sub.setFirstSubscribedAt(OffsetDateTime.now());
        }
        
        sub.setLastPaymentDate(OffsetDateTime.now());
        sub.setSubscriptionEndedAt(null); // Clear any lapse flag
        
        return subscriptionRepo.save(sub);
    }

    /**
     * Downgrade a parent back to free tier (e.g., they cancelled or billing failed).
     * Sets subscription_ended_at to now; the grace period (90 days) begins.
     * After grace expires, the retention job will clean up their archived reports.
     */
    @Transactional
    public ParentSubscription downgradeToPremium(UUID parentUserId) {
        ParentSubscription sub = getOrCreateSubscription(parentUserId);
        
        if (sub.getTier() == SubscriptionTier.PREMIUM) {
            sub.setSubscriptionEndedAt(OffsetDateTime.now());
        }
        
        return subscriptionRepo.save(sub);
    }

    /**
     * Query the parent's current tier, accounting for grace period expiry.
     * Returns 'free' or 'premium'.
     */
    public SubscriptionTier getCurrentTier(UUID parentUserId) {
        ParentSubscription sub = getOrCreateSubscription(parentUserId);
        return sub.isActivePremium() ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE;
    }

    /**
     * Get the price constant (for API responses or admin views).
     */
    public String getPremiumPriceZAR() {
        return PREMIUM_PRICE_ZAR;
    }
}
