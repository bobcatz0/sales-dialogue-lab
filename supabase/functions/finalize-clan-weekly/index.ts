import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calculate the previous week's Monday
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - mondayOffset);
    thisMonday.setUTCHours(0, 0, 0, 0);

    const lastMonday = new Date(thisMonday);
    lastMonday.setUTCDate(thisMonday.getUTCDate() - 7);

    const weekStartStr = lastMonday.toISOString().split("T")[0];
    const weekEndStr = thisMonday.toISOString();

    // Get all clan members
    const { data: members } = await supabase
      .from("clan_members")
      .select("clan_id, user_id");

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ message: "No clans" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = members.map((m: any) => m.user_id);

    // Get elo_history for last week
    const { data: history } = await supabase
      .from("elo_history")
      .select("user_id, session_score, created_at")
      .in("user_id", userIds)
      .gte("created_at", lastMonday.toISOString())
      .lt("created_at", weekEndStr);

    // Build user -> clan map
    const userClanMap = new Map<string, string>();
    for (const m of members) {
      userClanMap.set(m.user_id, m.clan_id);
    }

    // Aggregate scores per clan
    const clanScores = new Map<string, { totalScore: number; sessions: number }>();
    for (const h of history ?? []) {
      const clanId = userClanMap.get(h.user_id);
      if (!clanId) continue;
      const existing = clanScores.get(clanId) ?? { totalScore: 0, sessions: 0 };
      existing.totalScore += h.session_score;
      existing.sessions += 1;
      clanScores.set(clanId, existing);
    }

    if (clanScores.size === 0) {
      return new Response(JSON.stringify({ message: "No activity last week" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get clan names
    const clanIds = [...clanScores.keys()];
    const { data: clans } = await supabase
      .from("clans")
      .select("id, name")
      .in("id", clanIds);

    const clanNameMap = new Map((clans ?? []).map((c: any) => [c.id, c.name]));

    // Rank clans
    const ranked = [...clanScores.entries()]
      .map(([clanId, s]) => ({
        clan_id: clanId,
        clan_name: clanNameMap.get(clanId) ?? "Unknown",
        week_start: weekStartStr,
        total_score: s.totalScore,
        total_sessions: s.sessions,
      }))
      .sort((a, b) => b.total_score - a.total_score)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    // Upsert results
    const { error } = await supabase
      .from("clan_weekly_results")
      .upsert(ranked, { onConflict: "clan_id,week_start" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Weekly results finalized", count: ranked.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
