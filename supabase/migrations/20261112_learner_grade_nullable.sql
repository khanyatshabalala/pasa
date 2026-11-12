-- Allow grade_id to be NULL on learners so a learner record can be auto-created
-- when a parent's link request is approved by a school admin, without requiring
-- the grade to be known at that point. The school admin can fill it in later.
ALTER TABLE public.learners ALTER COLUMN grade_id DROP NOT NULL;
