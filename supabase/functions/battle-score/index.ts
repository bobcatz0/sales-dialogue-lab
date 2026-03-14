import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenarioPrompt, responseA, responseB, scenarioEnv, scenarioRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a strict, objective sales performance judge. You will score two sales responses to the same prospect scenario.

SCENARIO CONTEXT:
Environment: ${scenarioEnv}
Role: ${scenarioRole}
Prospect prompt: "${scenarioPrompt}"

Score each response on these criteria (0-100 each):
- Clarity (25%): Is the response clear, specific, and easy to follow?
- Objection Handling (25%): Does it address the prospect's concern effectively?
- Persuasion (25%): Is it compelling without being pushy?
- Next Step (25%): Does it move the conversation forward with a concrete action?

Return ONLY a JSON object with this exact structure:
{
  "scoreA": <number 0-100>,
  "scoreB": <number 0-100>,
  "feedbackA": "<2 sentences: what was strong and what could improve>",
  "feedbackB": "<2 sentences: what was strong and what could improve>",
  "verdictReason": "<1 sentence: why the winner won>"
}

SCORING RULES:
- Score independently. Do not anchor one score to the other.
- If both are weak, both can score low.
- Ties are allowed if scores are within 2 points of each other — set them equal.
- Be strict. 85+ requires quantified examples and a clear next step.
- No motivational language. Clinical assessment only.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Response A:\n"${responseA}"\n\nResponse B:\n"${responseB}"`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      result = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      result = {
        scoreA: 50,
        scoreB: 50,
        feedbackA: "Unable to parse detailed feedback.",
        feedbackB: "Unable to parse detailed feedback.",
        verdictReason: "Both responses were evaluated but detailed analysis was unavailable.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("battle-score error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
