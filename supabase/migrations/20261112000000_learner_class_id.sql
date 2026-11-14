-- Add class_id to learners so a learner can be assigned to a specific class
-- (e.g. Grade 10A vs 10B). The column is nullable — not all schools split
-- grades into named classes, and auto-created learners don't have a class yet.
ALTER TABLE public.learners
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_learners_class_id ON public.learners(class_id);
