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
    const { messages, roleTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a sales coaching expert reviewing a practice roleplay conversation. The user was practicing with a "${roleTitle}" persona.

Analyze the conversation and return a JSON object with this EXACT structure:
{
  "score": <number 0-100>,
  "rank": "<rank string>",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "nextDrill": "One specific drill or exercise the user should practice next"
}

Scoring rubric:
- 0-20: Beginner — struggles with basics, no structure
- 21-40: Developing — shows awareness but inconsistent execution
- 41-60: Competent — solid fundamentals, some gaps under pressure
- 61-80: Skilled — strong technique, handles objections well
- 81-100: Expert — exceptional control, natural flow, closes effectively

Rank labels (use exactly):
- 0-20: "Beginner"
- 21-40: "Developing"
- 41-60: "Competent"
- 61-80: "Skilled"
- 81-100: "Expert"

ALWAYS return exactly 3 strengths, exactly 3 improvements, and exactly 1 nextDrill.
Be honest but encouraging. Focus on: discovery questions, objection handling, tone, pacing, and driving toward next steps.
If the conversation was very short, note that and still provide useful feedback.
Return ONLY the JSON object, no markdown fences.`;

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
              content: `Here is the conversation to review:\n\n${messages
                .map((m: { role: string; text: string }) =>
                  `${m.role === "user" ? "Sales Rep" : roleTitle}: ${m.text}`
                )
                .join("\n")}`,
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

    // Parse the JSON from the AI response
    let feedback;
    try {
      feedback = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      feedback = {
        score: 50,
        rank: "Competent",
        strengths: ["Unable to parse detailed feedback"],
        improvements: ["Try a longer conversation for better analysis"],
        nextDrill: "Practice a full discovery call from start to finish",
      };
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("roleplay-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
