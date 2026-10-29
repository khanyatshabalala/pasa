package com.pasa.backend.subscription;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Tracks a parent's subscription tier, payment dates, and grace period.
 * All parents start at 'free' tier; premium requires an active subscription.
 * 
 * Rules:
 * - Free tier: subscription_ended_at and last_payment_date are NULL.
 * - Premium: tier='premium', first_subscribed_at is set, last_payment_date is updated on payment.
 * - Lapsed premium (subscription_ended_at set): remains premium until 90 days have passed 
 *   (grace period); then reverts to free. After-grace queries use a helper function.
 */
@Entity
@Table(name = "parent_subscriptions", schema = "public")
public class ParentSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "parent_user_id", nullable = false)
    private UUID parentUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionTier tier = SubscriptionTier.FREE;

    @Column(name = "first_subscribed_at")
    private OffsetDateTime firstSubscribedAt;

    @Column(name = "last_payment_date")
    private OffsetDateTime lastPaymentDate;

    @Column(name = "subscription_ended_at")
    private OffsetDateTime subscriptionEndedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public ParentSubscription() {}

    public ParentSubscription(UUID parentUserId) {
        this.parentUserId = parentUserId;
        this.tier = SubscriptionTier.FREE;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getParentUserId() { return parentUserId; }
    public void setParentUserId(UUID parentUserId) { this.parentUserId = parentUserId; }

    public SubscriptionTier getTier() { return tier; }
    public void setTier(SubscriptionTier tier) { this.tier = tier; }

    public OffsetDateTime getFirstSubscribedAt() { return firstSubscribedAt; }
    public void setFirstSubscribedAt(OffsetDateTime firstSubscribedAt) { this.firstSubscribedAt = firstSubscribedAt; }

    public OffsetDateTime getLastPaymentDate() { return lastPaymentDate; }
    public void setLastPaymentDate(OffsetDateTime lastPaymentDate) { this.lastPaymentDate = lastPaymentDate; }

    public OffsetDateTime getSubscriptionEndedAt() { return subscriptionEndedAt; }
    public void setSubscriptionEndedAt(OffsetDateTime subscriptionEndedAt) { this.subscriptionEndedAt = subscriptionEndedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    /**
     * True if the parent is currently premium (not in grace period after lapse).
     */
    public boolean isActivePremium() {
        if (tier != SubscriptionTier.PREMIUM) return false;
        if (subscriptionEndedAt == null) return true;
        // Grace period: 90 days from end date
        return subscriptionEndedAt.plusDays(90).isAfter(OffsetDateTime.now());
    }

    public enum SubscriptionTier {
        FREE,
        PREMIUM
    }
}
