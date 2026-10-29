package com.pasa.backend.subscription;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Super-admin only: manage parent subscription tiers and billing.
 * This controller is not exposed in the frontend UI until subscription launch.
 * 
 * Price: R50/month for premium tier.
 */
@RestController
@RequestMapping("/api/v1/admin/subscriptions")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SubscriptionAdminController {

    private final SubscriptionService subscriptionService;

    public SubscriptionAdminController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * Get a parent's current subscription status.
     */
    @GetMapping("/{parentUserId}")
    public ResponseEntity<SubscriptionResponse> getSubscription(@PathVariable UUID parentUserId) {
        ParentSubscription sub = subscriptionService.getOrCreateSubscription(parentUserId);
        return ResponseEntity.ok(toResponse(sub));
    }

    /**
     * Upgrade a parent to premium (admin action, e.g., after payment received).
     */
    @PostMapping("/{parentUserId}/upgrade")
    public ResponseEntity<SubscriptionResponse> upgradeToPremium(@PathVariable UUID parentUserId) {
        ParentSubscription sub = subscriptionService.upgradeToPremium(parentUserId);
        return ResponseEntity.ok(toResponse(sub));
    }

    /**
     * Downgrade a parent to free (admin action, e.g., cancellation or failed payment).
     * Begins the 90-day grace period.
     */
    @PostMapping("/{parentUserId}/downgrade")
    public ResponseEntity<SubscriptionResponse> downgradeToPremium(@PathVariable UUID parentUserId) {
        ParentSubscription sub = subscriptionService.downgradeToPremium(parentUserId);
        return ResponseEntity.ok(toResponse(sub));
    }

    /**
     * Manually record a payment (renew/extend subscription).
     */
    @PostMapping("/{parentUserId}/payment")
    public ResponseEntity<SubscriptionResponse> recordPayment(@PathVariable UUID parentUserId) {
        ParentSubscription sub = subscriptionService.upgradeToPremium(parentUserId);
        return ResponseEntity.ok(toResponse(sub));
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private SubscriptionResponse toResponse(ParentSubscription sub) {
        long daysUntilGraceExpires = 0;
        if (sub.getSubscriptionEndedAt() != null) {
            OffsetDateTime graceEnd = sub.getSubscriptionEndedAt().plusDays(90);
            daysUntilGraceExpires = java.time.temporal.ChronoUnit.DAYS.between(
                OffsetDateTime.now(),
                graceEnd
            );
        }

        return new SubscriptionResponse(
            sub.getParentUserId(),
            sub.getTier().toString().toLowerCase(),
            sub.getFirstSubscribedAt(),
            sub.getLastPaymentDate(),
            sub.getSubscriptionEndedAt(),
            sub.isActivePremium(),
            Math.max(0, daysUntilGraceExpires)
        );
    }
}
