import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Soft-reset ELO: pull everyone toward 1000 by 50%
function softReset(elo: number): number {
  return Math.round(1000 + (elo - 1000) * 0.5);
}

function getRank(elo: number): string {
  if (elo >= 1800) return "Sales Architect";
  if (elo >= 1500) return "Rainmaker";
  if (elo >= 1300) return "Operator";
  if (elo >= 1100) return "Closer";
  if (elo >= 900) return "Prospector";
  return "Rookie";
}

function getBadge(rank: string, position: number): string | null {
  // Top 3 get special badges
  if (position === 1) return "Season Champion";
  if (position === 2) return "Season Runner-Up";
  if (position === 3) return "Season Bronze";
  // Rank-based badges for top tiers
  if (rank === "Sales Architect") return "Sales Architect";
  if (rank === "Rainmaker") return "Rainmaker";
  if (rank === "Operator") return "Operator";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find the active season that has ended
  const now = new Date().toISOString();
  const { data: season, error: seasonErr } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .lte("ends_at", now)
    .single();

  if (seasonErr || !season) {
    return new Response(
      JSON.stringify({ message: "No active season to finalize" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get all profiles with sessions, ordered by ELO
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, elo, total_sessions")
    .gt("total_sessions", 0)
    .order("elo", { ascending: false })
    .limit(1000);

  if (profilesErr || !profiles || profiles.length === 0) {
    return new Response(
      JSON.stringify({ message: "No profiles to process" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Record season results
  const results = profiles.map((p, idx) => {
    const rank = getRank(p.elo);
    const badge = getBadge(rank, idx + 1);
    return {
      season_id: season.id,
      user_id: p.id,
      final_elo: p.elo,
      final_rank: rank,
      leaderboard_position: idx + 1,
      badge_awarded: badge,
      total_sessions: p.total_sessions,
    };
  });

  // Insert in batches of 100
  for (let i = 0; i < results.length; i += 100) {
    const batch = results.slice(i, i + 100);
    const { error: insertErr } = await supabase
      .from("season_results")
      .insert(batch);
    if (insertErr) {
      console.error("Insert error:", insertErr);
    }
  }

  // Soft-reset all ELO ratings and reset weekly gains
  for (const p of profiles) {
    const newElo = softReset(p.elo);
    await supabase
      .from("profiles")
      .update({ elo: newElo, weekly_elo_gain: 0 })
      .eq("id", p.id);
  }

  // Mark season as completed
  await supabase
    .from("seasons")
    .update({ status: "completed" })
    .eq("id", season.id);

  // Activate the next upcoming season
  const { data: nextSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "upcoming")
    .order("starts_at", { ascending: true })
    .limit(1)
    .single();

  if (nextSeason) {
    await supabase
      .from("seasons")
      .update({ status: "active" })
      .eq("id", nextSeason.id);
  }

  return new Response(
    JSON.stringify({
      message: `Season "${season.name}" finalized`,
      playersProcessed: profiles.length,
      nextSeasonActivated: !!nextSeason,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
