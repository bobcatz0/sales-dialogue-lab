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

    // Calculate current week's Monday
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - mondayOffset);
    thisMonday.setUTCHours(0, 0, 0, 0);
    const weekStart = thisMonday.toISOString().split("T")[0];

    // Check if rivalries already exist for this week
    const { data: existing } = await supabase
      .from("clan_rivalries")
      .select("id")
      .eq("week_start", weekStart)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update scores for existing rivalries
      const { data: rivalries } = await supabase
        .from("clan_rivalries")
        .select("*")
        .eq("week_start", weekStart)
        .eq("status", "active");

      if (rivalries && rivalries.length > 0) {
        for (const rivalry of rivalries) {
          // Get members for both clans
          const { data: membersA } = await supabase
            .from("clan_members")
            .select("user_id")
            .eq("clan_id", rivalry.clan_a_id);

          const { data: membersB } = await supabase
            .from("clan_members")
            .select("user_id")
            .eq("clan_id", rivalry.clan_b_id);

          const userIdsA = (membersA ?? []).map((m: any) => m.user_id);
          const userIdsB = (membersB ?? []).map((m: any) => m.user_id);

          // Get elo_history for this week
          let scoreA = 0, sessionsA = 0, scoreB = 0, sessionsB = 0;

          if (userIdsA.length > 0) {
            const { data: histA } = await supabase
              .from("elo_history")
              .select("session_score")
              .in("user_id", userIdsA)
              .gte("created_at", thisMonday.toISOString());
            for (const h of histA ?? []) {
              scoreA += h.session_score;
              sessionsA++;
            }
          }

          if (userIdsB.length > 0) {
            const { data: histB } = await supabase
              .from("elo_history")
              .select("session_score")
              .in("user_id", userIdsB)
              .gte("created_at", thisMonday.toISOString());
            for (const h of histB ?? []) {
              scoreB += h.session_score;
              sessionsB++;
            }
          }

          await supabase
            .from("clan_rivalries")
            .update({
              clan_a_score: scoreA,
              clan_b_score: scoreB,
              clan_a_sessions: sessionsA,
              clan_b_sessions: sessionsB,
            })
            .eq("id", rivalry.id);
        }
      }

      return new Response(
        JSON.stringify({ message: "Rivalry scores updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new rivalries: get all clans with at least 1 member, sorted by ELO
    const { data: clans } = await supabase
      .from("clans")
      .select("id, clan_elo, total_members")
      .gt("total_members", 0)
      .order("clan_elo", { ascending: false });

    if (!clans || clans.length < 2) {
      return new Response(
        JSON.stringify({ message: "Not enough clans for rivalries" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pair adjacent clans by ELO for competitive matchups
    const pairs: { clan_a_id: string; clan_b_id: string; week_start: string }[] = [];
    const paired = new Set<string>();

    for (let i = 0; i < clans.length - 1; i++) {
      if (paired.has(clans[i].id)) continue;
      for (let j = i + 1; j < clans.length; j++) {
        if (paired.has(clans[j].id)) continue;
        pairs.push({
          clan_a_id: clans[i].id,
          clan_b_id: clans[j].id,
          week_start: weekStart,
        });
        paired.add(clans[i].id);
        paired.add(clans[j].id);
        break;
      }
    }

    if (pairs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pairs formed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase.from("clan_rivalries").insert(pairs);
    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Rivalries created", count: pairs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
