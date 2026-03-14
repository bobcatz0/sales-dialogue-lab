import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Flash challenge pool - rotates through these
const FLASH_SCENARIOS = [
  { title: "Cold Call Objection Blitz", description: "Handle rapid-fire objections from a skeptical prospect. Speed and composure matter.", scenario_env: "cold-call", scenario_role: "skeptical-buyer", bonus_elo: 15 },
  { title: "60-Second Elevator Pitch", description: "You have one minute to hook a VP in an elevator. Make every word count.", scenario_env: "cold-call", scenario_role: "b2b-prospect", bonus_elo: 20 },
  { title: "Price Negotiation Sprint", description: "Procurement wants 40% off. Defend your pricing without losing the deal.", scenario_env: "enterprise", scenario_role: "decision-maker", bonus_elo: 20 },
  { title: "Gatekeeper Gauntlet", description: "Three gatekeepers, three chances. Get through to the decision maker.", scenario_env: "cold-call", scenario_role: "gatekeeper", bonus_elo: 15 },
  { title: "Discovery Under Pressure", description: "A prospect gives you 3 minutes. Uncover their real pain before time runs out.", scenario_env: "cold-call", scenario_role: "b2b-prospect", bonus_elo: 18 },
  { title: "Competitive Displacement", description: "The prospect loves their current vendor. Find the cracks without bashing.", scenario_env: "enterprise", scenario_role: "skeptical-buyer", bonus_elo: 20 },
  { title: "Champion Coaching Sprint", description: "Your champion has 5 minutes before the board meeting. Arm them fast.", scenario_env: "enterprise", scenario_role: "champion", bonus_elo: 25 },
  { title: "Technical Objection Drill", description: "A technical evaluator found 3 gaps. Address them without losing credibility.", scenario_env: "enterprise", scenario_role: "technical-evaluator", bonus_elo: 22 },
];

// Duration options in hours
const DURATIONS = [2, 3, 4];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Expire any active challenges past their end time
    await supabase
      .from("flash_challenges")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("ends_at", new Date().toISOString());

    // Check if there's a current active challenge
    const { data: active } = await supabase
      .from("flash_challenges")
      .select("id")
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .limit(1);

    if (active && active.length > 0) {
      return new Response(JSON.stringify({ message: "Active challenge exists", id: active[0].id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick a random scenario
    const scenario = FLASH_SCENARIOS[Math.floor(Math.random() * FLASH_SCENARIOS.length)];
    const duration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];
    const now = new Date();
    const endsAt = new Date(now.getTime() + duration * 60 * 60 * 1000);

    const { data: newChallenge, error } = await supabase
      .from("flash_challenges")
      .insert({
        title: scenario.title,
        description: scenario.description,
        scenario_env: scenario.scenario_env,
        scenario_role: scenario.scenario_role,
        bonus_elo: scenario.bonus_elo,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ message: "New flash challenge created", challenge: newChallenge }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
