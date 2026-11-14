-- Add grade_id and class_id to parent_link_requests so parents can specify
-- which grade and class their child is in when submitting a link request.
-- These are used when auto-creating a learner record on approval.
ALTER TABLE public.parent_link_requests
  ADD COLUMN IF NOT EXISTS grade_id  int  REFERENCES public.grades(id),
  ADD COLUMN IF NOT EXISTS class_id  uuid REFERENCES public.classes(id) ON DELETE SET NULL;
