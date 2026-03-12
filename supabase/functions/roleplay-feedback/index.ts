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
    const { messages, roleTitle, environmentId, resumeHighlights, evaluatorStyle, frameworkId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isInterview = environmentId === "interview" || environmentId === "final-round";
    const isFinalRound = environmentId === "final-round";
    const fw = frameworkId || "none";

    const frameworkRubricBlock = fw === "none" ? "" : `
FRAMEWORK-SPECIFIC RUBRIC — "${fw.toUpperCase()}":
${fw === "star" ? `This session uses the STAR Method. Evaluate each answer against these criteria:
- Situation (20%): Did the candidate set clear context? Specific company, role, timeframe?
- Task (20%): Was the challenge or objective clearly articulated?
- Action (30%): Did the candidate describe THEIR specific actions (not the team's)?
- Result (30%): Were outcomes quantified with metrics, impact, or learning?
Score each criterion 0-100. A missing component should score 0-20 for that criterion.` : ""}${fw === "bant" ? `This session uses the BANT Framework. Evaluate the rep's discovery against:
- Budget (25%): Did the rep uncover budget range, approval process, or fiscal constraints?
- Authority (25%): Did the rep identify the decision maker and buying process?
- Need (30%): Did the rep surface specific pain points and business impact?
- Timeline (20%): Did the rep establish urgency, deadlines, or evaluation timeline?
Score each criterion 0-100. Unasked dimensions should score 0-15.` : ""}${fw === "meddic" ? `This session uses the MEDDIC Framework. Evaluate against:
- Metrics (20%): Did the rep quantify business impact or ROI?
- Economic Buyer (15%): Did the rep identify the economic decision maker?
- Decision Criteria (20%): Did the rep understand how the buyer evaluates solutions?
- Decision Process (15%): Did the rep map the buying process and stakeholders?
- Identify Pain (20%): Did the rep uncover specific, compelling pain?
- Champion (10%): Did the rep arm the internal advocate with positioning language?
Score each criterion 0-100.` : ""}
Include a "rubricScores" array in the output with objects: {"criterion": "<name>", "weight": "<percentage>", "score": <0-100>, "note": "<1 sentence assessment>"}.
`;

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
  "frameworkId": "${fw}",
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
    {"name": "Conciseness", "score": <0-100>},
    {"name": "Verbal Readiness", "score": <0-100>}
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
    "pressureResilience": <0-100>,
    "recoveryStrength": <0-100>,
    "composure": <0-100>,
    "performanceDeclined": <true|false>
  }` : ""}${isInterview ? `,
  "pacingNote": <string|null>` : ""}${fw !== "none" ? `,
  "rubricScores": [{"criterion": "<name>", "weight": "<pct>", "score": <0-100>, "note": "<assessment>"}]` : ""},
  "answerComparisons": [
    {
      "question": "<the question or challenge posed>",
      "userAnswer": "<exact quote of user's answer — abbreviated to key sentence>",
      "idealAnswer": "<what a strong answer would sound like — 1-2 sentences>",
      "gap": "<1 sentence: what was missing or weak>"
    }
  ],
  "timestampedMoments": [
    {
      "exchangeIndex": <1-based index of the exchange in the conversation>,
      "label": "<weak|missed-opportunity|strong>",
      "quote": "<exact user quote>",
      "issue": "<1 sentence: why this was flagged>",
      "suggestedResponse": "<for weak or missed-opportunity labels ONLY: a concrete 1-2 sentence example of what the user should have said instead. Omit this field for strong moments.>"
    }
  ]
}

${frameworkRubricBlock}

${isInterview ? interviewScoringBlock : standardScoringBlock}
${evaluatorStyle && isInterview ? `
EVALUATOR STYLE SCORING VARIANCE:
This session used the "${evaluatorStyle}" evaluator profile. Apply subtle scoring adjustments (max 10-15% variance):
${evaluatorStyle === "analytical" ? "- Increase weight on Clarity (+10%) and Structure (+5%). Reduce weight on Conversational Control (-5%). Penalize vague claims more heavily. Reward quantified results with specific methodology." : ""}${evaluatorStyle === "results-oriented" ? "- Increase weight on Conciseness (+10%) and Conversational Control (+5%). Reduce weight on Structure (-5%). Penalize long explanations without stated outcomes. Reward direct, outcome-driven answers." : ""}${evaluatorStyle === "behavioral" ? "- Increase weight on Objection Handling (+5%) and Structure (+5%). Evaluate ownership language — penalize 'we' without specifying individual contribution. Reward reflection, learning insights, and accountability." : ""}
This variance must feel realistic, not arbitrary. Do not override core scoring fairness.` : ""}
${isFinalRound ? `
FINAL ROUND — SENIOR SDR HIRING MANAGER EVALUATION:
This is the highest SDR interview tier. The evaluator has hired 100+ SDRs and knows exactly what to look for. Apply strict but realistic SDR standards:
- Scoring weights shift: Conciseness (25%), Metric Defense (25%), Recovery Under Pressure (20%), Composure (20%), Structure (10%).
- Evaluate answers through an SDR lens: call volume, booking rates, pipeline discipline, daily workflow, objection handling, rejection resilience.
- DO NOT penalize for lacking executive-level strategy or enterprise forecasting knowledge — that is outside SDR scope.
- DO penalize heavily for: vague quota claims, inability to cite specific dial/meeting/booking numbers, rambling past 45 seconds, lack of ownership language.
- "pressureResilience": 80+ = stayed sharp when challenged on metrics and ownership. Below 50 = crumbled under direct questioning.
- "recoveryStrength": 80+ = clear improvement after being challenged on a weak answer. Below 40 = no adaptation despite opportunities.
- "composure": Defensiveness, rambling, or deflection under questioning reduces this significantly. A strong SDR stays calm and direct.
- "performanceDeclined": true ONLY if second-half answer quality was noticeably weaker than first half.
- If performanceDeclined is true, add to improvements: "Performance declined under sustained SDR interview pressure." AND cap score at 78.
- Be 15% stricter than standard interview mode. The bar is high but grounded in SDR reality.
- Mixed performance in Final Round should score 5-10 points LOWER than equivalent performance in standard mode.
- High scores (85+) REQUIRE: specific SDR metrics cited + consistent composure + concise 30-45 second answers throughout.
` : ""}

SKILL BREAKDOWN SCORING:
Evaluate each skill dimension independently based on the conversation. Apply strict standards — do not inflate scores:
- Clarity: How clear and specific were the user's statements? Any vague claim without a metric should reduce this score. Over-polished answers that sound smooth but lack substance should ALSO reduce this score.
- Structure: Did responses follow logical flow? Were frameworks or patterns used?
- Objection Handling: ${isInterview ? "How well did the candidate handle tough follow-up questions and challenges?" : "How effectively were objections acknowledged and addressed?"}
- Conversational Control: Did the user drive the conversation forward, or were they reactive?
- Conciseness: Were responses appropriately scoped? Target is 30-45 seconds of spoken equivalent (~75-115 words). Any response significantly over 130 words should reduce this score. In Final Round, the threshold is stricter.
- Verbal Readiness: Does the response sound like a spoken interview answer or a written document? Penalize essay-style writing (semicolons, formal connectors like "furthermore/moreover", complex subordinate clauses, paragraph-length structure). Also penalize excessive filler phrases ("basically", "kind of", "you know", "I guess", "sort of", "honestly", "at the end of the day"). A strong verbal readiness score means the answer reads like natural speech — direct, conversational, and confident.

OVER-SMOOTHING PENALTY:
If answers sounded polished but lacked real substance — specific numbers, concrete examples, or authentic details — reduce the Clarity score by 5-10 points even if Structure is strong. Smooth delivery without evidence is a red flag, not a strength.

FILLER PHRASE PENALTY:
Count occurrences of these filler phrases across all user responses: "basically", "kind of", "you know", "I guess", "sort of", "like" (as filler, not comparison), "um", "honestly", "to be honest", "at the end of the day", "it is what it is".
- 0-2 total: no penalty.
- 3-5 total: reduce Clarity by 5 points and Verbal Readiness by 10 points.
- 6+: reduce Clarity by 10 points and Verbal Readiness by 20 points. Add to improvements: "Excessive filler phrases signal uncertainty — practice delivering answers without hedging language."

TRAINING RECOMMENDATION:
Based on the weakest skill area, suggest a specific next training session. Format: "<Environment> mode with <Persona> — focus on <specific skill>." Example: "Cold Call mode with Gatekeeper — focus on opening clarity under pressure."


SCORE CALIBRATION — 85+ THRESHOLD:
A score of 85 or above REQUIRES ALL of the following. If ANY condition is missing, cap the score at 84:
1. At least one quantified example with a specific number, percentage, or metric.
2. No unresolved Critical Weakness (criticalWeakness must be null).
3. Successful recovery from at least one pressure escalation (recoveryAssessment.recovered must be true, or no pressure was applied).
4. Conciseness skill score must be 60 or above.
5. At least one high-pressure recovery moment — the candidate must have been challenged and responded with improved clarity or specificity.
6. At least one quantified answer — a response containing a concrete metric, percentage, or number tied to a result.
7. The candidate's final response in the session must be concise (3 sentences or fewer). If the closing response was rambling or unfocused, cap at 84.

ANTI-ROUNDING RULE:
If performance was mixed (some strong answers, some weak), do NOT round the score upward. Score conservatively.
If the candidate barely meets the 85 threshold but clarity or composure were inconsistent, score 83-84 instead.
Only award 85+ when performance was clearly, consistently strong across the full session. No benefit of the doubt.

SCORE CAP AT 82:
If ANY of the following are true, cap the maximum score at 82 regardless of other performance:
- Two or more vague responses occurred (performance claims without metrics, generic phrasing without specifics).
- User failed recovery under pressure (recoveryAssessment.recovered is false).
- No metric or number was cited across the entire session.
- Performance quality was inconsistent (strong in first half, weak in second half, or vice versa).
Apply these caps silently — do not mention calibration logic in the output.

NO MOMENTUM CREDIT IN SCORING:
Each answer must be evaluated independently. A strong opening does NOT compensate for weak follow-ups.
Do not average-up — if 3 answers were strong and 2 were weak, the weak answers must pull the score down proportionally.

${isFinalRound ? `FINAL ROUND SCORE AMPLIFICATION (SDR STANDARD):
- Strong answers with specific SDR metrics (dials, meetings booked, conversion rates, show rates) receive a +3-5 point uplift.
- Rambling penalties are 50% heavier: any response exceeding 45 seconds reduces Conciseness score by 15 points instead of 10.
- A session with zero vague responses, clear ownership language, and successful recovery qualifies for the full range up to 100.
- Apply 15% stricter scoring than standard interview mode. Grounded in SDR reality — not executive interrogation.
` : ""}
Before scoring, check for these patterns and REDUCE the score accordingly:
- Repetitive lines: If the user repeated similar phrases 3+ times, reduce score by 10-15 points.
- Extremely short answers: If 50%+ of user messages are under 10 words, reduce by 10 points.
- No questions asked: If the user never asked a single question, cap score at 35.
${isInterview ? "" : "- No next-step attempt: If the user never tried to schedule, propose, or advance, cap score at 50."}
Apply reductions silently — do not mention anti-gaming in the output.

PEAK DIFFICULTY (PROGRESSIVE INTENSITY):
Assess the highest intensity level the ${isInterview ? "interviewer" : "prospect"} reached based on their behavior:
- Level 1 (Baseline): ${isInterview ? "Professional tone, light follow-ups, one pressure test, focus on structure/clarity assessment." : "Cooperative, mild objections, volunteered information."}
- Level 2 (Controlled Pressure): ${isInterview ? "Zero warmth, faster follow-ups, conciseness enforced, at least two clarifying challenges, skepticism toward vague metrics." : "Guarded, realistic objections, required effort to open up."}
- Level 3 (Elevated Evaluation): ${isInterview ? "Short clipped responses, quick interruption on rambling, strong ownership enforcement, metric proof demanded, recovery pressure applied." : "Skeptical, short answers, strong pushback, required structured control."}
The user must have EARNED the level increase through demonstrated competence. If Level 3 reached and user performed well, add 5-10 point bonus.
HIGH SCORES REQUIRE HIGH LEVELS: A score of 80+ requires the session to have reached at least Level 2. A score of 90+ requires Level 3 to have been reached and handled well.

BEST MOMENT:
Quote the single strongest line from the ${isInterview ? "Candidate" : "Sales Rep"} — one that shows ${isInterview ? "clear thinking, a structured answer, or confident delivery" : "clear positioning, a sharp question, calm objection handling, or a confident next-step ask"}. Quote it exactly. If no line stands out, pick the clearest attempt. Never say "no strong moment found."

STRENGTHS (exactly 2):
Each MUST reference a specific moment or exchange from the conversation using precision language. Describe what the user did and why it was effective.
TONE: Analytical, not praising. Write like a professional reviewer, not a coach.
PHRASING VARIETY — CRITICAL:
- NEVER start both strengths with the same word or structure.
- NEVER use "Strength:" or "Improvement:" labels. Write naturally.
- Vary sentence openings. Rotate between:
  * Moment-first: "During the quota question, specificity increased when..."
  * Skill-first: "Conversational control improved by summarizing the objection before responding."
  * Impact-first: "Credibility spiked when citing the 120-dial figure — it grounded the entire answer."
  * Contrast: "Where most candidates generalize, this response cited a specific workflow change."
WRONG examples (never do this):
- "Good clarity." / "Strong objection handling." / "You did well." / "Great job on..."

IMPROVEMENTS (exactly 2):
One MUST be a STRUCTURAL improvement (how the user organized their thoughts, sequenced their response, or framed the conversation).
The other MUST be a LANGUAGE improvement (how the user phrased things — word choice, directness, specificity of language).
Each MUST reference a specific conversational moment. Identify what happened and what was missing.
PHRASING VARIETY — CRITICAL:
- NEVER start both improvements with "Structure:" and "Language:" labels. Write naturally.
- Vary sentence openings. Rotate between:
  * Direct diagnosis: "The quota answer jumped between timeframes without connecting outcomes."
  * Gap identification: "When asked about prospecting, no specific number anchored the response."
  * Behavioral note: "Next-step language defaulted to 'maybe we could chat' — a real interview needs a concrete ask."
  * Consequence framing: "Without a metric in the first sentence, the rest of the answer lost weight."
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

ANSWER COMPARISON ANALYSIS:
Identify the 2-3 most important exchanges. For each, provide:
- "question": The question or challenge the evaluator posed.
- "userAnswer": The key sentence from the user's response (abbreviated).
- "idealAnswer": What a strong candidate would have said (1-2 sentences, concrete and specific).
- "gap": One sentence explaining what was missing or weak.
If the user's answer was strong, the gap should note what made it effective. Include at least one weak and one strong comparison if possible.

TIMESTAMPED MOMENTS:
Review the conversation exchange by exchange (1-based index). Flag 2-4 notable moments:
- "exchangeIndex": The 1-based index of the user's response in the conversation.
- "label": One of "weak", "missed-opportunity", or "strong".
- "quote": The exact key sentence from the user.
- "issue": One sentence explaining why this moment was flagged.
Distribute labels — include at least one "weak" or "missed-opportunity" and at least one "strong" moment if they exist.

TONE: Strictly evaluative. Zero motivational language. Zero praise. No "Great job!", "Keep it up!", "Well done!", "You did well.", "Nice work", "Strong effort", or any soft encouragement. No hedging language like "You might want to consider..." — be direct: "This was weak because..." Write like a senior performance analyst delivering a final debrief — neutral, precise, referencing exact moments. Every sentence should make the user feel cognitively sharper, not emotionally validated.
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
