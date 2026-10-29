package com.pasa.backend.service;

import com.pasa.backend.domain.entity.ReportCard;
import com.pasa.backend.repository.ReportCardRepository;
import com.pasa.backend.subscription.ParentSubscription;
import com.pasa.backend.subscription.ParentSubscriptionRepository;
import com.pasa.backend.storage.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implements report-card retention policy:
 * - Free tier: keep only the latest report per learner; delete when a new one arrives.
 * - Premium tier: keep current year's all quarterly reports + past 2 years' year-end (Term 4) only.
 * 
 * Soft-delete logic:
 * - When deleted, set deleted_at timestamp but keep the row (for audit/history).
 * - Separately, a background job can batch-delete soft-deleted files from object storage.
 */
@Slf4j
@Service
public class ReportCardRetentionService {

    private final ReportCardRepository reportCardRepo;
    private final ParentSubscriptionRepository subscriptionRepo;
    private final StorageService storageService;
    private final JdbcTemplate jdbc;

    public ReportCardRetentionService(
            ReportCardRepository reportCardRepo,
            ParentSubscriptionRepository subscriptionRepo,
            StorageService storageService,
            JdbcTemplate jdbc) {
        this.reportCardRepo = reportCardRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.storageService = storageService;
        this.jdbc = jdbc;
    }

    /**
     * Called when a new report is uploaded. If the parent is free tier, delete the previous
     * report for this learner (if any). If premium, the archive logic handles retention automatically.
     */
    public void enforceFreeTierDeleteOnReplace(UUID learnerId, int academicYear, int term) {
        // Find if any linked parent is free tier (not premium).
        Boolean hasFreeTierParent = jdbc.queryForObject("""
            SELECT EXISTS (
              SELECT 1 FROM public.parent_links pl
              WHERE pl.learner_id = ?
                AND public.parent_subscription_tier(pl.parent_user_id) = 'free'
            )
            """, Boolean.class, learnerId);
        
        if (!Boolean.TRUE.equals(hasFreeTierParent)) {
            // All parents are premium; learner is archived. Don't delete.
            return;
        }

        // This learner has at least one free-tier parent. Delete any previous non-deleted report in this year.
        jdbc.update("""
            UPDATE public.report_cards
            SET deleted_at = now()
            WHERE learner_id = ?
              AND academic_year = ?
              AND deleted_at IS NULL
              AND NOT (academic_year = ? AND term = ?)
            """, learnerId, academicYear, academicYear, term);
    }

    /**
     * Scheduled job: cleanup expired reports for lapsed-premium parents.
     * When a premium parent's subscription ends, set a 90-day grace period.
     * After grace expires, delete their archived reports per the policy:
     * keep Term 4 from past 2 years + current year's quarterly reports (if any exist after grace).
     * For simplicity here, we delete ALL premium-owned reports once the grace period expires.
     * (More nuanced: keep only those qualifying reports, delete the rest.)
     */
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    @Transactional
    public void cleanupExpiredPremiumReports() {
        // 1. Lapsed-premium parents past the 90-day grace: delete everything they were archiving.
        List<ParentSubscription> lapsedPremium = subscriptionRepo.findLapsedPremiumBeyondGrace();
        for (ParentSubscription sub : lapsedPremium) {
            cleanupForParent(sub.getParentUserId());
        }

        // 2. Active-premium learners: prune to the rolling retention window
        //    (current year keeps all terms; the 2 prior years keep Term 4 only;
        //     anything older is dropped).
        pruneActivePremiumArchives();

        // 3. Purge storage files for anything soft-deleted above (and in prior runs).
        purgeDeletedStorageFiles();
    }

    /**
     * Remove the backing PDF from object storage for reports that were soft-deleted
     * (deleted_at set) but whose file has not yet been purged (file_purged_at null).
     *
     * Runs in its own transaction, batched (up to 500 rows per run) to bound work.
     * The row is kept for audit; only the storage object is removed, then file_purged_at
     * is stamped so the same key is never re-attempted. A storage failure on one key is
     * swallowed so a single bad object does not stall the batch — it is simply retried
     * next run (file_purged_at stays null).
     */
    @Transactional
    public void purgeDeletedStorageFiles() {
        List<ReportCard> pending = reportCardRepo.findTop500ByDeletedAtIsNotNullAndFilePurgedAtIsNull();
        for (ReportCard rc : pending) {
            boolean removed = true;
            if (rc.getFilePath() != null) {
                try {
                    storageService.delete(rc.getFilePath());
                } catch (Exception e) {
                    removed = false; // leave file_purged_at null so it retries next run
                }
            }
            if (removed) {
                rc.setFilePurgedAt(OffsetDateTime.now());
                reportCardRepo.save(rc);
            }
        }
    }

    /**
     * Rolling-window prune for learners with at least one active-premium parent.
     *
     * Retention window, anchored on each learner's most recent report year (its "current" year):
     *   - current year:            keep ALL terms (1-4)
     *   - current year - 1 and -2: keep Term 4 (year-end) ONLY
     *   - current year - 3 or older: drop entirely
     *
     * Anchoring on the learner's latest report year (rather than the server clock) keeps the
     * window stable within an academic year and only trims once a newer year's reports arrive.
     * Soft-deletes (sets deleted_at); a learner with no premium parent is untouched here
     * (free-tier handling owns those via delete-on-replace).
     */
    @Transactional
    public void pruneActivePremiumArchives() {
        jdbc.update("""
            WITH premium_learners AS (
                SELECT DISTINCT pl.learner_id
                FROM   public.parent_links pl
                WHERE  public.is_parent_premium(pl.parent_user_id)
            ),
            anchor AS (
                -- The "current" academic year per learner = the latest year with a live report.
                SELECT rc.learner_id, MAX(rc.academic_year) AS current_year
                FROM   public.report_cards rc
                JOIN   premium_learners pm ON pm.learner_id = rc.learner_id
                WHERE  rc.deleted_at IS NULL
                GROUP  BY rc.learner_id
            )
            UPDATE public.report_cards rc
            SET    deleted_at = now()
            FROM   anchor a
            WHERE  rc.learner_id = a.learner_id
              AND  rc.deleted_at IS NULL
              AND  rc.academic_year < a.current_year        -- current year is always fully kept
              AND  (
                     rc.academic_year < a.current_year - 2  -- older than 2 prior years: drop all
                     OR rc.term <> 4                        -- within window but not year-end: drop
                   )
            """);
    }

    /**
     * Delete all archived reports (reports the parent was keeping due to premium) for a given parent.
     */
    private void cleanupForParent(UUID parentUserId) {
        // Delete all non-deleted reports that the parent's learners had archived due to premium.
        jdbc.update("""
            UPDATE public.report_cards
            SET deleted_at = now()
            WHERE deleted_at IS NULL
              AND learner_id IN (
                SELECT DISTINCT pl.learner_id
                FROM public.parent_links pl
                WHERE pl.parent_user_id = ?
              )
            """, parentUserId);
    }

}
