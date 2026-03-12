-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'evaluator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS on user_roles: users can read their own roles, admins can manage
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Evaluator reviews table
CREATE TABLE public.evaluator_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id uuid NOT NULL,
  session_user_id uuid NOT NULL,
  session_date text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluator_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read reviews
CREATE POLICY "Anyone can read reviews"
  ON public.evaluator_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Only evaluators can insert reviews
CREATE POLICY "Evaluators can insert reviews"
  ON public.evaluator_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = evaluator_id
    AND public.has_role(auth.uid(), 'evaluator')
  );

-- 6. Add evaluator reputation to profiles
ALTER TABLE public.profiles
  ADD COLUMN is_evaluator boolean NOT NULL DEFAULT false,
  ADD COLUMN evaluator_reputation integer NOT NULL DEFAULT 0,
  ADD COLUMN reviews_given integer NOT NULL DEFAULT 0;