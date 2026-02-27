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
    const { messages, roleTitle, environmentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isInterview = environmentId === "interview";

    const interviewScoringBlock = `
INTERVIEW-SPECIFIC SCORING CRITERIA (use these weights):
- Clarity of communication (30%): Were answers clear, specific, and easy to follow?
- Structure (20%): Did the candidate use logical frameworks or storytelling structure (STAR, situation-action-result)?
- Confidence (20%): Did the candidate sound assured and professional, not defensive or uncertain?
- Specific examples (20%): Did the candidate cite real situations with concrete details, numbers, or outcomes?
- Conciseness (10%): Were answers focused and appropriately scoped, not rambling?

INTERVIEW-SPECIFIC OUTPUT FORMAT:
Replace the standard "strengths" and "improvements" with:
- "strengths": ["<communication strength>", "<structural strength>"] — label each clearly (e.g., "Communication: ..." or "Structure: ...")
- "improvements": ["<primary development area>"] — exactly 1 specific area to focus on
- "nextDrill": Frame as "Suggested focus for next interview: <specific recommendation>"
- "rank": Replace with interview readiness levels: "Not Ready" (0-30), "Developing" (31-50), "Prepared" (51-70), "Strong Candidate" (71-85), "Interview Ready" (86-100)
`;

    const standardScoringBlock = `
SCORING RULES:
- 0-20: "Rookie" — Cannot hold a conversation, no questions asked, no direction.
- 21-40: "Starter" — Some effort but vague, no objection handling, no next step.
- 41-60: "Closer" — Decent structure, some good questions, but gaps in objection handling or next-step clarity.
- 61-80: "Operator" — Strong conversation control, good questions, handles objections, drives toward outcome.
- 81-100: "Rainmaker" — Exceptional across all dimensions. Rare.
`;

    const systemPrompt = `You are a direct, no-nonsense ${isInterview ? "interview performance analyst" : "sales performance analyst"}. Review this practice conversation where the user ${isInterview ? "was interviewed by" : "played a sales rep against"} a "${roleTitle}" persona.

Return a JSON object with this EXACT structure — nothing else:
{
  "score": <number 0-100>,
  "rank": "<rank string>",
  "peakDifficulty": <1 | 2 | 3>,
  "bestMoment": "<exact quote>",
  "strengths": ["<strength>", "<strength>"],
  "improvements": ["<improvement>"${isInterview ? "" : ', "<improvement>"'}],
  "nextDrill": "<one sentence>",
  "skillBreakdown": [
    {"name": "Clarity", "score": <0-100>},
    {"name": "Structure", "score": <0-100>},
    {"name": "Objection Handling", "score": <0-100>},
    {"name": "Conversational Control", "score": <0-100>},
    {"name": "Conciseness", "score": <0-100>}
  ],
  "trainingRecommendation": "<one sentence: suggest next environment + persona + specific skill>"
}

${isInterview ? interviewScoringBlock : standardScoringBlock}

SKILL BREAKDOWN SCORING:
Evaluate each skill dimension independently based on the conversation:
- Clarity: How clear and specific were the user's statements? Did they avoid vague language?
- Structure: Did responses follow logical flow? Were frameworks or patterns used?
- Objection Handling: ${isInterview ? "How well did the candidate handle tough follow-up questions and challenges?" : "How effectively were objections acknowledged and addressed?"}
- Conversational Control: Did the user drive the conversation forward, or were they reactive?
- Conciseness: Were responses appropriately scoped, not too long or too short?

TRAINING RECOMMENDATION:
Based on the weakest skill area, suggest a specific next training session. Format: "<Environment> mode with <Persona> — focus on <specific skill>." Example: "Cold Call mode with Gatekeeper — focus on opening clarity under pressure."

ANTI-GAMING SCORE ADJUSTMENT:
Before scoring, check for these patterns and REDUCE the score accordingly:
- Repetitive lines: If the user repeated similar phrases 3+ times, reduce score by 10-15 points.
- Extremely short answers: If 50%+ of user messages are under 10 words, reduce by 10 points.
- No questions asked: If the user never asked a single question, cap score at 35.
${isInterview ? "" : "- No next-step attempt: If the user never tried to schedule, propose, or advance, cap score at 50."}
Apply reductions silently — do not mention anti-gaming in the output.

PEAK DIFFICULTY:
Assess the highest difficulty the ${isInterview ? "interviewer" : "prospect"} reached based on their behavior:
- Level 1: Cooperative, mild ${isInterview ? "follow-ups" : "objections"}, volunteered information.
- Level 2: Guarded, ${isInterview ? "probing follow-ups, challenged vague answers" : "realistic objections, required effort to open up"}.
- Level 3: ${isInterview ? "Tough follow-ups, challenged assumptions, pressure questions" : "Skeptical, short answers, strong pushback, required structured control"}.
If Level 3 reached and user performed well, add 5-10 point bonus.

BEST MOMENT:
Quote the single strongest line from the ${isInterview ? "Candidate" : "Sales Rep"} — one that shows ${isInterview ? "clear thinking, a structured answer, or confident delivery" : "clear positioning, a sharp question, calm objection handling, or a confident next-step ask"}. Quote it exactly. If no line stands out, pick the clearest attempt. Never say "no strong moment found."

STRENGTHS (exactly 2):
Each MUST reference a specific moment or exchange from the conversation. Never use generic praise like "Good communication" or "Strong presence."
CORRECT examples:
- "When asked about quota shortfall, cited specific recovery actions with measurable outcomes."
- "After the budget objection, reframed cost as monthly per-seat — shifted the framing effectively."
WRONG examples (never do this):
- "Good clarity." / "Strong objection handling." / "Communicated well."

IMPROVEMENTS (exactly ${isInterview ? "1" : "2"}):
Each MUST reference a specific conversational moment where the user fell short. Identify what happened and what was missing.
CORRECT examples:
- "When discussing quota performance, no specific metrics were provided — the answer stayed abstract."
- "The budget objection was addressed without first confirming decision-making authority."
WRONG examples (never do this):
- "Improve clarity." / "Work on objection handling." / "Be more concise."

NEXT DRILL (exactly 1 sentence):
${isInterview ? "One specific interview preparation exercise tailored to the identified development area." : "One specific exercise tailored to this persona type. Actionable and concrete."}

TONE: Neutral and direct. No motivational language. No "Great job!" or "Keep it up!" — just clear, specific analysis that references actual moments from the conversation.

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
