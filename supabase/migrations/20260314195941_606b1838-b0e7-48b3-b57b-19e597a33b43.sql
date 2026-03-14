
-- Assessments created by managers/recruiters
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(8), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active'
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Managers can read own assessments
CREATE POLICY "Managers can read own assessments"
  ON public.assessments FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Managers can create assessments
CREATE POLICY "Managers can create assessments"
  ON public.assessments FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND has_role(auth.uid(), 'manager'));

-- Managers can update own assessments
CREATE POLICY "Managers can update own assessments"
  ON public.assessments FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Anyone (including anon) can read assessment by invite code for candidate access
CREATE POLICY "Anyone can read assessment by invite code"
  ON public.assessments FOR SELECT TO anon
  USING (status = 'active');

-- Assessment submissions from candidates (no auth required)
CREATE TABLE public.assessment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  score INTEGER NOT NULL,
  percentile INTEGER NOT NULL DEFAULT 50,
  skill_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  stage_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;

-- Managers can read submissions for their assessments
CREATE POLICY "Managers can read own assessment submissions"
  ON public.assessment_submissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = assessment_submissions.assessment_id
    AND a.created_by = auth.uid()
  ));

-- Anon can insert submissions
CREATE POLICY "Anyone can submit assessment"
  ON public.assessment_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);
