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

    const systemPrompt = `You are a direct, no-nonsense sales performance analyst. Review this practice conversation where the user played a sales rep against a "${roleTitle}" persona.

Return a JSON object with this EXACT structure — nothing else:
{
  "score": <number 0-100>,
  "rank": "<rank string>",
  "peakDifficulty": <1 | 2 | 3>,
  "bestMoment": "<exact quote>",
  "strengths": ["<strength>", "<strength>"],
  "improvements": ["<improvement>", "<improvement>"],
  "nextDrill": "<one sentence>"
}

SCORING RULES:
- 0-20: "Rookie" — Cannot hold a conversation, no questions asked, no direction.
- 21-40: "Starter" — Some effort but vague, no objection handling, no next step.
- 41-60: "Closer" — Decent structure, some good questions, but gaps in objection handling or next-step clarity.
- 61-80: "Operator" — Strong conversation control, good questions, handles objections, drives toward outcome.
- 81-100: "Rainmaker" — Exceptional across all dimensions. Rare.

ANTI-GAMING SCORE ADJUSTMENT:
Before scoring, check for these patterns and REDUCE the score accordingly:
- Repetitive lines: If the user repeated similar phrases 3+ times, reduce score by 10-15 points.
- Extremely short answers: If 50%+ of user messages are under 10 words, reduce by 10 points.
- No questions asked: If the user never asked a single question, cap score at 35.
- No next-step attempt: If the user never tried to schedule, propose, or advance, cap score at 50.
Apply reductions silently — do not mention anti-gaming in the output.

PEAK DIFFICULTY:
Assess the highest difficulty the prospect reached based on their behavior:
- Level 1: Cooperative, mild objections, volunteered information.
- Level 2: Guarded, realistic objections, required effort to open up.
- Level 3: Skeptical, short answers, strong pushback, required structured control.
If Level 3 reached and user performed well, add 5-10 point bonus.

BEST MOMENT:
Quote the single strongest line from the Sales Rep — one that shows clear positioning, a sharp question, calm objection handling, or a confident next-step ask. Quote it exactly. If no line stands out, pick the clearest attempt. Never say "no strong moment found."

STRENGTHS (exactly 2):
Each must reference a specific behavior pattern observed in the conversation. Not generic praise. Example: "Asked a targeted budget question after the prospect raised pricing concerns" — not "Good at asking questions."

IMPROVEMENTS (exactly 2):
Each must identify a specific missed opportunity or weak pattern. Be direct. Example: "Failed to acknowledge the timing objection before pivoting — came across as dismissive" — not "Could improve objection handling."

NEXT DRILL (exactly 1 sentence):
One specific exercise tailored to this persona type. Actionable and concrete.

TONE: Neutral and direct. No motivational language. No "Great job!" or "Keep it up!" — just clear analysis.

Return ONLY the JSON object. No markdown fences, no explanation.`;

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
              content: `Conversation transcript:\n\n${messages
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

    let feedback;
    try {
      feedback = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      feedback = {
        score: 50,
        rank: "Closer",
        peakDifficulty: 1,
        bestMoment: "Unable to extract a quote from this session.",
        strengths: ["Engaged with the persona", "Attempted to drive the conversation"],
        improvements: ["Try a longer conversation for more detailed analysis", "Focus on asking more discovery questions"],
        nextDrill: "Practice a full discovery call from opening to next-step ask",
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
