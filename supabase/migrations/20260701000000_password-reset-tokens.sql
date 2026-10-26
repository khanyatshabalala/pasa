-- ============================================================
-- Password reset tokens
-- Backend-managed: forgot-password stores a token here; reset-password
-- validates it (and checks expiry) before updating auth.users.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token      text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON public.password_reset_tokens(token);
