package com.pasa.backend.subscription;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Response DTO for a parent's subscription status.
 * Not exposed in frontend until subscription launch date.
 */
public record SubscriptionResponse(
    UUID parentUserId,
    String tier,                   // 'free' or 'premium'
    OffsetDateTime firstSubscribedAt,
    OffsetDateTime lastPaymentDate,
    OffsetDateTime subscriptionEndedAt,
    boolean isActivePremium,       // True if premium and not in grace period
    long daysUntilGraceExpires     // For lapsed premium: days left before downgrade to free
) {}
