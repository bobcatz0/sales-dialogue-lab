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
    const { messages, roleTitle, environmentId, resumeHighlights, evaluatorStyle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isInterview = environmentId === "interview" || environmentId === "final-round";
    const isFinalRound = environmentId === "final-round";

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
  "trainingRecommendation": "<one sentence: suggest next environment + persona + specific skill>"${resumeHighlights ? `,
  "resumeAlignment": {
    "claimsMatched": <true if answers substantiated resume claims with specifics>,
    "metricsDefended": <true if numbers/metrics were backed with methodology or context>,
    "consistencyNote": "<1-2 sentence assessment of alignment between resume and answers>"
  }` : ""}${evaluatorStyle ? `,
  "evaluatorStyle": "${evaluatorStyle}"` : ""}${isInterview ? `,
  "exposureMoments": [
    {
      "weakAnswer": "<exact quote of the candidate's weakest or most problematic answer>",
      "reason": "<1 sentence: why this answer weakened their performance — be specific>",
      "correction": "<1 sentence: direct suggestion for how to fix it>"
    }
  ],
  "recoveryAssessment": {
    "recovered": <true if the candidate improved clarity/specificity after being challenged on a weak answer>,
    "note": "<one sentence: either 'Recovery Strength: Demonstrated improved clarity after pressure.' or 'Recovery Opportunity: Did not tighten response after follow-up pressure.'>"
  },
  "criticalWeakness": <if recoveryAssessment.recovered is false, provide this object; if recovered is true, set to null>{
    "weakResponse": "<exact quote of the weak answer that was not recovered>",
    "credibilityImpact": "<1 sentence: why this weakened credibility — e.g. 'In a real interview, this may signal lack of ownership or inflated performance.'>",
    "recoveryFailure": "<1 sentence: how the follow-up pressure was not addressed — e.g. 'Under follow-up pressure, clarity did not improve.'>",
    "correctiveExample": "<1 sentence: a concrete corrective answer the candidate could have given — e.g. 'At that time, I was averaging 95 calls per week, which increased to 120 after restructuring my call blocks.'>"
  }` : ""}${isFinalRound ? `,
  "finalRoundMetrics": {
    "pressureResilience": <0-100: how well the candidate maintained performance quality when challenged or pressured>,
    "recoveryStrength": <0-100: how effectively the candidate improved answers after being challenged on weak spots>,
    "composure": <0-100: how professional and steady the candidate remained throughout — no defensiveness, no rambling under stress>,
    "performanceDeclined": <true if the candidate's answer quality noticeably dropped in the second half of the session compared to the first half>
  }` : ""}${isInterview ? `,
  "pacingNote": <if any user responses were excessively long or rambling (would take ${isFinalRound ? "35+" : "45+"} seconds to speak), set to "Pacing Adjustment Needed: Responses exceeded optimal interview length." Otherwise set to null>` : ""}
}

${isInterview ? interviewScoringBlock : standardScoringBlock}
${evaluatorStyle && isInterview ? `
EVALUATOR STYLE SCORING VARIANCE:
This session used the "${evaluatorStyle}" evaluator profile. Apply subtle scoring adjustments (max 10-15% variance):
${evaluatorStyle === "analytical" ? "- Increase weight on Clarity (+10%) and Structure (+5%). Reduce weight on Conversational Control (-5%). Penalize vague claims more heavily. Reward quantified results with specific methodology." : ""}${evaluatorStyle === "results-oriented" ? "- Increase weight on Conciseness (+10%) and Conversational Control (+5%). Reduce weight on Structure (-5%). Penalize long explanations without stated outcomes. Reward direct, outcome-driven answers." : ""}${evaluatorStyle === "behavioral" ? "- Increase weight on Objection Handling (+5%) and Structure (+5%). Evaluate ownership language — penalize 'we' without specifying individual contribution. Reward reflection, learning insights, and accountability." : ""}
This variance must feel realistic, not arbitrary. Do not override core scoring fairness.` : ""}
${isFinalRound ? `
FINAL ROUND EVALUATION RULES:
This is an elevated-pressure final round. Apply stricter standards:
- Scoring weights shift: Conciseness (25%), Ownership (25%), Structure (25%), Next-Step Framing (15%), Composure (10%).
- Be 10-15% stricter on scoring than standard interview mode across all dimensions.
- "pressureResilience": 80+ = stayed sharp under pressure. Below 50 = crumbled.
- "recoveryStrength": 80+ = clear improvement after challenge. Below 40 = no adaptation.
- "composure": Defensiveness, rambling, or visible frustration reduce this score.
- "performanceDeclined": true ONLY if second-half answer quality was noticeably weaker than first half.
- If performanceDeclined is true, add to improvements: "Performance declined under elevated pressure."
- Do NOT shield the score. Final round standards are higher.
` : ""}

SKILL BREAKDOWN SCORING:
Evaluate each skill dimension independently based on the conversation. Apply strict standards — do not inflate scores:
- Clarity: How clear and specific were the user's statements? Any vague claim without a metric should reduce this score. Over-polished answers that sound smooth but lack substance should ALSO reduce this score.
- Structure: Did responses follow logical flow? Were frameworks or patterns used?
- Objection Handling: ${isInterview ? "How well did the candidate handle tough follow-up questions and challenges?" : "How effectively were objections acknowledged and addressed?"}
- Conversational Control: Did the user drive the conversation forward, or were they reactive?
- Conciseness: Were responses appropriately scoped? Any response that would take 45+ seconds to speak aloud should significantly reduce this score. In Final Round, the threshold is 35 seconds.

OVER-SMOOTHING PENALTY:
If answers sounded polished but lacked real substance — specific numbers, concrete examples, or authentic details — reduce the Clarity score by 5-10 points even if Structure is strong. Smooth delivery without evidence is a red flag, not a strength.

TRAINING RECOMMENDATION:
Based on the weakest skill area, suggest a specific next training session. Format: "<Environment> mode with <Persona> — focus on <specific skill>." Example: "Cold Call mode with Gatekeeper — focus on opening clarity under pressure."


SCORE CALIBRATION — 85+ THRESHOLD:
A score of 85 or above REQUIRES ALL of the following. If ANY condition is missing, cap the score at 84:
1. At least one quantified example with a specific number, percentage, or metric.
2. No unresolved Critical Weakness (criticalWeakness must be null).
3. Successful recovery from at least one pressure escalation (recoveryAssessment.recovered must be true, or no pressure was applied).
4. Conciseness skill score must be 60 or above.

SCORE CAP AT 82:
If ANY of the following are true, cap the maximum score at 82 regardless of other performance:
- Two or more vague responses occurred (performance claims without metrics, generic phrasing without specifics).
- User failed recovery under pressure (recoveryAssessment.recovered is false).
Apply these caps silently — do not mention calibration logic in the output.

${isFinalRound ? `FINAL ROUND SCORE AMPLIFICATION:
- Strong answers with quantified evidence and clear structure should receive a +3-5 point uplift compared to standard interview mode.
- Rambling penalties are 50% heavier in Final Round: any response exceeding 35 seconds reduces Conciseness score by 15 points instead of 10.
- A session with zero vague responses and successful recovery qualifies for the full scoring range up to 100.
` : ""}
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
Each MUST reference a specific moment or exchange from the conversation using precision language. Describe what the user did and why it was effective.
TONE: Analytical, not praising. Write like a professional reviewer, not a coach.
CORRECT examples:
- "Clarity improved when specifying metrics during the quota performance question — shifted from abstract to concrete."
- "Control increased when summarizing the objection before responding — demonstrated structured listening."
WRONG examples (never do this):
- "Good clarity." / "Strong objection handling." / "You did well." / "Great job on..."

IMPROVEMENTS (exactly 2):
One MUST be a STRUCTURAL improvement (how the user organized their thoughts, sequenced their response, or framed the conversation).
The other MUST be a LANGUAGE improvement (how the user phrased things — word choice, directness, specificity of language).
Each MUST reference a specific conversational moment. Identify what happened and what was missing.
If the user rambled, state: "Response lacked structure — [specific moment]."
If the user was vague, state: "Language lacked specificity — [specific moment]."
CORRECT examples:
- "Structure: When discussing quota performance, the answer lacked logical sequencing — jumped between timeframes without connecting outcomes."
- "Language: Next-step framing lacked directness — 'maybe we could chat again' should be a clear calendar ask."
WRONG examples (never do this):
- "Improve clarity." / "Work on objection handling." / "Be more concise." / "Keep practicing."

NEXT DRILL (exactly 1 sentence):
Must be a specific micro-drill tied to the environment and persona used. Format: actionable instruction the user can practice immediately.
CORRECT examples:
- "Focus on giving quantified results within the first 30 seconds of any answer."
- "Practice asking for the next step before explaining features."
- "Drill: open with a one-sentence value hypothesis before any discovery question."
WRONG examples:
- "Practice more." / "Try again with this persona." / "Work on your skills."

${isInterview ? `
EXPOSURE MOMENT ANALYSIS:
Identify the single weakest answer from the candidate. Detect these patterns:
- VAGUE: Generic language, no metrics, broad summaries ("I improved results", "I worked hard")
- BLAME-SHIFTING: Deflecting responsibility ("The team decided", "Marketing wasn't helping")
- REHEARSED: Overly polished, formulaic answers that lack authentic detail
- OVER-EXPLAINING: Rambling past the point without a clear takeaway
Quote the exact weak answer. Explain precisely why it weakened the response. Provide one direct correction.
If multiple weak moments exist, pick the most impactful one. If the candidate performed well throughout, still identify the relatively weakest moment.
Tone: Direct. Precise. No emotional language. No praise padding.

RECOVERY ASSESSMENT:
After a weak-spot was exposed and the evaluator applied pressure, assess whether the candidate recovered:
- "recovered": true if the candidate's follow-up answer showed specific metrics, clear ownership, or concise structure after being challenged.
- "recovered": false if the candidate continued with vague, deflective, or rambling answers after pressure.
- "note": If recovered: "Recovery Strength: Demonstrated improved clarity after pressure." If not: "Recovery Opportunity: Did not tighten response after follow-up pressure."
If recovery occurred, apply a subtle +3-5 point bonus to the overall score. Do not mention the bonus in output.
If recovery FAILED, apply a -5-10 point penalty to the overall score. Do NOT shield the score. Reflect the failure honestly.

CRITICAL WEAKNESS (only when recovery failed):
When recoveryAssessment.recovered is false, populate "criticalWeakness" with:
- "weakResponse": The exact quote that remained weak after pressure.
- "credibilityImpact": Why this damages interview credibility. Be direct — e.g. "This may signal lack of ownership or inflated performance."
- "recoveryFailure": How the follow-up failed — e.g. "Under follow-up pressure, clarity did not improve."
- "correctiveExample": A concrete, realistic example answer the candidate should have given. Make it specific to their context.
When recovery succeeded, set "criticalWeakness" to null.
` : ""}
TONE: Professional review. No motivational language. No "Great job!", "Keep it up!", "Well done!", "You did well.", or any soft encouragement. Write like a performance analyst delivering a debrief — neutral, precise, referencing exact moments. Every sentence should make the user feel cognitively sharper.
${resumeHighlights ? `
RESUME ALIGNMENT ANALYSIS:
The candidate provided these resume highlights before the session:
"""
${resumeHighlights}
"""
Evaluate whether the candidate's answers substantiated these claims:
- "claimsMatched": Did answers provide specific evidence backing resume claims? Or were claims left unsupported?
- "metricsDefended": When metrics were referenced (percentages, numbers, quotas), did the candidate explain methodology, context, or timeframes? Round numbers without context should be flagged.
- "consistencyNote": Write 1-2 sentences assessing alignment. Example: "Claimed 15% booking rate but could not explain what changed to achieve it. Salesforce usage was mentioned but workflow details were absent."
No praise. No flattery. Neutral evaluation only.` : ""}

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
