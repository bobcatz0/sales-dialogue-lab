/**
 * Evaluator utilities — check role, load reviews, submit reviews.
 */
import { supabase } from "@/integrations/supabase/client";

export interface EvaluatorReview {
  id: string;
  evaluator_id: string;
  session_user_id: string;
  session_date: string;
  score: number;
  feedback: string | null;
  created_at: string;
}

/** Check if current user has the evaluator role */
export async function checkIsEvaluator(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "evaluator")
    .maybeSingle();

  return !!data;
}

/** Load evaluator profile stats from profiles table */
export async function loadEvaluatorStats(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("is_evaluator, evaluator_reputation, reviews_given")
    .eq("id", userId)
    .single();

  return data;
}

/** Submit an evaluator review for a session */
export async function submitReview(
  sessionUserId: string,
  sessionDate: string,
  score: number,
  feedback: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("evaluator_reviews").insert({
    evaluator_id: user.id,
    session_user_id: sessionUserId,
    session_date: sessionDate,
    score,
    feedback,
  });

  if (error) return false;

  // Increment reviews_given and reputation
  await supabase
    .from("profiles")
    .update({
      reviews_given: (await supabase.from("profiles").select("reviews_given").eq("id", user.id).single()).data?.reviews_given + 1 || 1,
      evaluator_reputation: (await supabase.from("profiles").select("evaluator_reputation").eq("id", user.id).single()).data?.evaluator_reputation + 5 || 5,
    })
    .eq("id", user.id);

  return true;
}

/** Check if a session has been human-reviewed */
export async function getSessionReview(
  sessionUserId: string,
  sessionDate: string
): Promise<EvaluatorReview | null> {
  const { data } = await supabase
    .from("evaluator_reviews")
    .select("*")
    .eq("session_user_id", sessionUserId)
    .eq("session_date", sessionDate)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as EvaluatorReview) ?? null;
}
