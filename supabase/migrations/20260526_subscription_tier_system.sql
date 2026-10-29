-- ============================================================
-- Migration: Subscription tier system for report-card retention
-- ============================================================
-- Introduces: 
--   - subscription_tiers enum (free, premium)
--   - parent_subscriptions table (tracks tier + payment dates)
--   - deleted_at on report_cards (soft delete for retention)
--   - Functions for retention logic (free: delete-on-replace, premium: archive)
-- ============================================================

-- ── Subscription Tier Enum ─────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium');
  END IF;
END $$;

-- ── Parent Subscriptions Table ────────────────────────────────
-- Tracks each parent's subscription status, billing dates, and tier.
CREATE TABLE IF NOT EXISTS public.parent_subscriptions (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                   subscription_tier NOT NULL DEFAULT 'free',
  
  -- Billing: first_subscribed_at and last_payment_date track the subscription lifecycle.
  -- For free tier, these are NULL.
  -- When tier changes from free → premium, first_subscribed_at is set (if not already set).
  -- On payment, last_payment_date is updated.
  first_subscribed_at    timestamptz,
  last_payment_date      timestamptz,
  
  -- If subscription lapses, set this; used to compute grace period (90 days from here).
  -- NULL = currently active.
  subscription_ended_at  timestamptz,
  
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_parent_subscription UNIQUE (parent_user_id)
);

ALTER TABLE public.parent_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='parent_subscriptions' AND policyname='Parents view own subscription') THEN
    CREATE POLICY "Parents view own subscription" ON public.parent_subscriptions
      FOR SELECT USING (auth.uid() = parent_user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='parent_subscriptions' AND policyname='Super admins manage subscriptions') THEN
    CREATE POLICY "Super admins manage subscriptions" ON public.parent_subscriptions
      FOR ALL USING (public.is_super_admin(auth.uid()));
  END IF;
END $$;

-- ── Add Soft-Delete Columns to Report Cards ───────────────
-- deleted_at    : NULL (visible) or a timestamp (soft-deleted by retention).
-- file_purged_at: NULL until the backing PDF has been removed from object storage.
--                 The purge pass stamps this so it never re-attempts the same key.
ALTER TABLE IF EXISTS public.report_cards 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE IF EXISTS public.report_cards 
ADD COLUMN IF NOT EXISTS file_purged_at timestamptz DEFAULT NULL;

-- ── Helper: Get a parent's current subscription tier ──────────
-- Returns 'free' or 'premium'. Accounts for lapsed subscriptions 
-- (premium lapses after 90 days without payment).
CREATE OR REPLACE FUNCTION public.parent_subscription_tier(
  _parent_user_id uuid
)
RETURNS subscription_tier LANGUAGE sql STABLE AS $$
  SELECT COALESCE((
    SELECT tier
    FROM public.parent_subscriptions
    WHERE parent_user_id = _parent_user_id
      AND (
        -- Active: no end date, OR end date + grace (90 days) not yet passed.
        subscription_ended_at IS NULL
        OR subscription_ended_at + INTERVAL '90 days' > now()
      )
    LIMIT 1
  ), 'free'::subscription_tier);
$$;

-- ── Helper: Is parent premium (not in grace period)? ──────────
CREATE OR REPLACE FUNCTION public.is_parent_premium(
  _parent_user_id uuid
)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE((
    SELECT tier = 'premium'::subscription_tier
    FROM public.parent_subscriptions
    WHERE parent_user_id = _parent_user_id
      AND subscription_ended_at IS NULL
    LIMIT 1
  ), false);
$$;

-- ── Helper: Any parent of a learner is premium? ──────────────
-- Used by retention policy to decide if learner's reports should be archived.
CREATE OR REPLACE FUNCTION public.has_premium_parent(
  _learner_id uuid
)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_links pl
    WHERE pl.learner_id = _learner_id
      AND public.is_parent_premium(pl.parent_user_id)
  );
$$;

-- ── View: Visible report cards (excludes soft-deleted) ────────
-- Use this in queries to filter out deleted reports.
CREATE OR REPLACE VIEW public.report_cards_visible AS
SELECT * FROM public.report_cards
WHERE deleted_at IS NULL;

-- ── Indexes for retention queries ────────────────────────────
-- When the retention job runs, it will query by learner, term, academic_year, deleted_at.
CREATE INDEX IF NOT EXISTS idx_report_cards_learner_term_year 
  ON public.report_cards (learner_id, academic_year, term, deleted_at);

CREATE INDEX IF NOT EXISTS idx_report_cards_deleted_at 
  ON public.report_cards (deleted_at) 
  WHERE deleted_at IS NULL;

-- Purge pass looks for soft-deleted rows whose storage file is not yet removed.
CREATE INDEX IF NOT EXISTS idx_report_cards_pending_purge 
  ON public.report_cards (deleted_at) 
  WHERE deleted_at IS NOT NULL AND file_purged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_parent_subscriptions_parent_id 
  ON public.parent_subscriptions (parent_user_id);

CREATE INDEX IF NOT EXISTS idx_parent_subscriptions_tier 
  ON public.parent_subscriptions (tier);

-- ── Bootstrap: Create subscription records for all existing parents ────
-- All are free tier initially.
INSERT INTO public.parent_subscriptions (parent_user_id, tier)
SELECT DISTINCT pl.parent_user_id
FROM public.parent_links pl
WHERE NOT EXISTS (
  SELECT 1 FROM public.parent_subscriptions ps
  WHERE ps.parent_user_id = pl.parent_user_id
);

-- Log what was inserted
DO $$
DECLARE
  inserted_count INT;
BEGIN
  SELECT COUNT(*) INTO inserted_count
  FROM public.parent_subscriptions
  WHERE created_at > now() - INTERVAL '1 second';
  
  RAISE NOTICE 'Bootstrap: Created % subscription records for existing parents', inserted_count;
END $$;
