/**
 * Challenge Mode — challenge friends to beat your score on a scenario.
 */

import { supabase } from "@/integrations/supabase/client";

export interface Challenge {
  id: string;
  creator_id: string;
  scenario_env: string;
  scenario_role: string;
  creator_score: number;
  challenger_id: string | null;
  challenger_score: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export async function createChallenge(
  scenarioEnv: string,
  scenarioRole: string,
  score: number
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      creator_id: user.id,
      scenario_env: scenarioEnv,
      scenario_role: scenarioRole,
      creator_score: score,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function loadChallenge(challengeId: string): Promise<Challenge | null> {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  return data as Challenge | null;
}

export async function acceptChallenge(
  challengeId: string,
  score: number
): Promise<{ won: boolean; creatorScore: number } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge || challenge.status !== "pending") return null;

  await supabase
    .from("challenges")
    .update({
      challenger_id: user.id,
      challenger_score: score,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", challengeId);

  return {
    won: score > (challenge as any).creator_score,
    creatorScore: (challenge as any).creator_score,
  };
}

export function getChallengeUrl(challengeId: string): string {
  return `${window.location.origin}/practice?challenge=${challengeId}`;
}
