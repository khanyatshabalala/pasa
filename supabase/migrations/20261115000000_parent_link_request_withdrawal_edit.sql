ALTER TYPE public.link_request_status ADD VALUE IF NOT EXISTS 'withdrawn';

DO $$
DECLARE
  unique_constraint_name text;
BEGIN
  SELECT constraint_row.conname INTO unique_constraint_name
  FROM pg_constraint AS constraint_row
  WHERE constraint_row.conrelid = 'public.parent_link_requests'::regclass
    AND constraint_row.contype = 'u'
    AND ARRAY(
      SELECT attribute.attname::text
      FROM unnest(constraint_row.conkey) AS keys(attnum)
      JOIN pg_attribute AS attribute
        ON attribute.attrelid = constraint_row.conrelid
       AND attribute.attnum = keys.attnum
      ORDER BY attribute.attname::text
    ) = ARRAY['learner_number', 'parent_user_id', 'school_id']::text[]
  LIMIT 1;

  IF unique_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.parent_link_requests DROP CONSTRAINT %I',
      unique_constraint_name
    );
  END IF;
END $$;

ALTER TABLE public.parent_link_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_link_requests_active_parent_school_learner
  ON public.parent_link_requests (parent_user_id, school_id, learner_number)
  WHERE status IN ('pending', 'approved');
