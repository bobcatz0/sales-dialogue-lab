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
  "peakDifficulty": <1 | 2 | 3>,
  "bestMoment": "The single strongest line spoken by the Sales Rep during the session, quoted exactly",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "nextDrill": "One specific drill or exercise the user should practice next, tailored to the ${roleTitle} role"
}

Scoring rubric and rank labels (use exactly):
- 0-20: "Rookie"
- 21-40: "Starter"
- 41-60: "Closer"
- 61-80: "Operator"
- 81-100: "Rainmaker"

For "peakDifficulty": Evaluate the conversation to determine the highest difficulty level the prospect character reached.
- Level 1 (Easy): Prospect was cooperative, answered clearly, offered info willingly, objections were mild.
- Level 2 (Normal): Prospect was more guarded, required better questions, had realistic/specific objections, needed clearer next-step asks.
- Level 3 (Hard): Prospect showed time pressure/skepticism, gave short answers with pushback, raised strong objections (timing, budget, competitors, authority), required structured control and confident asks.
Assess based on the prospect's actual behavior. If the user performed well enough that the prospect became more challenging, that indicates higher difficulty was reached.
If the user reached Level 3, add a slight bonus (5-10 points) to the score for performing well under pressure.

For "bestMoment": Select the Sales Rep line that best demonstrates one of these: clear positioning, a strong discovery question, calm objection handling, or a confident next-step ask. Quote it exactly as they wrote it. If no standout line exists, pick the clearest attempt — always label it "Best Moment" and never say "no strong moment found".

ALWAYS return exactly 3 strengths, exactly 3 improvements, and exactly 1 nextDrill.
Be honest but encouraging. Focus on: discovery questions, objection handling, tone, pacing, and driving toward next steps.
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
        rank: "Closer",
        peakDifficulty: 1,
        bestMoment: "Unable to extract a quote from this session.",
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
