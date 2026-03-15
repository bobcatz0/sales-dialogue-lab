import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Launch analytics ingestion endpoint.
 *
 * Receives structured events from the frontend and logs them as JSON to
 * Supabase Edge Function logs, which are queryable in the Supabase dashboard
 * under Functions → launch-analytics → Logs.
 *
 * This is intentionally simple for the first 100 users. Swap the console.log
 * for a database INSERT once volume warrants it.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const event = await req.json();

    // Validate required fields
    if (!event.event || !event.userId || !event.timestamp) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Structured log — captured in Supabase Function Logs and queryable
    // via the dashboard: Functions → launch-analytics → Logs
    console.log(JSON.stringify({
      type: "launch_analytics",
      event: event.event,
      userId: event.userId,
      timestamp: event.timestamp,
      properties: event.properties ?? {},
    }));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
