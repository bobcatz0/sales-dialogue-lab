import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookUrl, content, embeds } = await req.json();

    if (!webhookUrl || typeof webhookUrl !== "string") {
      return new Response(JSON.stringify({ error: "Missing webhookUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate it's a real Discord webhook URL
    const discordPattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!discordPattern.test(webhookUrl)) {
      return new Response(JSON.stringify({ error: "Invalid Discord webhook URL format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Record<string, unknown> = {};
    if (content) body.content = String(content).slice(0, 2000);
    if (embeds && Array.isArray(embeds)) body.embeds = embeds.slice(0, 10);

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error(`Discord webhook failed [${resp.status}]: ${errorText}`);
      return new Response(JSON.stringify({ error: `Discord returned ${resp.status}` }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Discord webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
