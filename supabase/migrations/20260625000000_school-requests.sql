-- ============================================================
-- School registration requests
-- Schools submit interest via the public landing page.
-- PASA admin reviews and reaches out to onboard them.
-- ============================================================

CREATE TYPE public.school_request_status AS ENUM (
  'pending',    -- just submitted, not yet reviewed
  'contacted',  -- admin has reached out
  'onboarded',  -- school is now on the platform
  'declined'    -- not a fit / duplicate / etc.
);

CREATE TABLE public.school_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name      text        NOT NULL,
  province         text        NOT NULL,
  district         text        NOT NULL,
  contact_name     text        NOT NULL,
  contact_role     text        NOT NULL, -- principal, admin, teacher, governing body
  contact_email    text        NOT NULL,
  contact_phone    text,
  message          text,       -- optional message from the requester
  status           public.school_request_status NOT NULL DEFAULT 'pending',
  admin_notes      text,       -- internal notes from PASA team
  reviewed_by      uuid        REFERENCES auth.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_school_requests_status ON public.school_requests(status);
CREATE INDEX idx_school_requests_province ON public.school_requests(province);

ALTER TABLE public.school_requests ENABLE ROW LEVEL SECURITY;

-- Public: anyone can insert a request (no auth required)
CREATE POLICY "Anyone can submit school requests"
  ON public.school_requests FOR INSERT
  WITH CHECK (true);

-- Super admin: view and update all requests
CREATE POLICY "Super admin manages school requests"
  ON public.school_requests FOR ALL
  USING (public.is_super_admin(auth.uid()));
