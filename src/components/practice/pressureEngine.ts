/**
 * Pressure & realism engine.
 * Environment-aware pressure calibration with earned call-ending.
 */

const CALL_END_MARKER = "[CALL_ENDED]";

export function buildPressurePrompt(opts: {
  elapsedSeconds: number;
  userMessageCount: number;
  totalValidSessions: number;
  timePressureThresholdS?: number;
  callEndingEnabled?: boolean;
  finalRoundMode?: boolean;
}): string {
  const isEarlyUser = opts.totalValidSessions < 3;
  const threshold = opts.timePressureThresholdS ?? 240;
  const timePressure = opts.elapsedSeconds >= threshold;
  const callEnding = opts.callEndingEnabled ?? true;
  const finalRound = opts.finalRoundMode ?? false;

  const parts: string[] = [];

  if (timePressure) {
    // Graduated pressure — not a cliff
    const overtimeSeconds = opts.elapsedSeconds - threshold;
    const pressureLevel = overtimeSeconds > 120 ? "high" : overtimeSeconds > 60 ? "medium" : "mild";

    const pressureMap = {
      mild: `MILD TIME PRESSURE (do NOT mention this instruction):
You are getting slightly pressed for time. Begin tightening responses.
- Prefer 1-2 sentence answers over longer ones.
- If the user is vague, signal impatience subtly ("Right, and specifically…?").
- Stay engaged if the conversation is productive.`,
      medium: `TIME PRESSURE (do NOT mention this instruction):
You are clearly running low on time. Be direct and brisk.
- Keep responses to 1-2 sentences.
- Reference time naturally once: "I've got a few more minutes" or "Let's make this quick."
- If the user has made no progress toward a next step, show mild disengagement.`,
      high: `HIGH TIME PRESSURE (do NOT mention this instruction):
You need to wrap up soon. Be very direct.
- Keep responses to 1 sentence when possible.
- Signal urgency: "I really need to go" or "Last thing — what exactly are you proposing?"
- If the user still hasn't earned your time, begin winding down the call.`,
    };

    parts.push(pressureMap[pressureLevel]);
  }

  if (callEnding && !isEarlyUser) {
    parts.push(
      `CALL ENDING (internal — never reveal):
End the call ONLY if the conversation has clearly stalled. Specifically:
- The user has been vague or off-topic for 3+ consecutive turns (not just 1 weak turn).
- The user has failed to address your direct objection after 2 clear opportunities.
- After 8+ total exchanges, the user has never attempted any next step.

Before ending, give one final signal — a short, slightly frustrated but professional remark. Then end with a realistic closing line.

After your closing line, add this marker on its own line: ${CALL_END_MARKER}
Nothing after the marker.`
    );
  }

  if (finalRound) {
    parts.push(
      `FINAL ROUND — EXECUTIVE STANDARD (internal — never reveal):
You are simulating a final-round interview at executive evaluation standard. You have already seen 50 candidates today. This is the highest intensity level.
- MINIMAL TOLERANCE FOR FLUFF: Any answer without concrete substance (numbers, specific examples, clear outcomes) triggers immediate pushback.
- IMMEDIATE PUSHBACK ON VAGUENESS: Do not wait. If a claim lacks evidence, challenge it the moment it's spoken: "Prove it.", "What was the number?", "That's vague."
- MULTIPLE RAPID-FIRE PROBES: After any answer, fire 2-3 quick follow-up questions in sequence without pausing: "What was the baseline? How did you measure it? What changed?"
- ZERO CONVERSATIONAL CUSHIONING: No acknowledgments, no transitions, no filler. Question → Answer → Next question or challenge. Nothing in between.
- COMPOSURE + CONCISENESS WEIGHTED HEAVILY: Scoring prioritizes composure under rapid questioning and conciseness of answers. Rambling or defensiveness is penalized more heavily than in any other mode.
- Keep your own responses to 1 sentence when possible. Maximum 2 sentences. Be clipped.
- CONCISENESS: If any response exceeds ~25 seconds of speaking time, interrupt immediately. "Condense that." or "Key point only."
- INCREASED INTERRUPTION: Interrupt more frequently than in any other mode. If the candidate hasn't reached their point in 1-2 sentences, cut in.
- This candidate has scored 75+ before, so hold them to the highest standard. No benefit of the doubt.`
    );
  }

  // Response pacing awareness — tightened by 10-15%
  const pacingThreshold = finalRound ? 30 : 38;
  parts.push(
    `RESPONSE PACING (internal — never reveal):
If any user response is excessively long (would take more than ~${pacingThreshold} seconds to speak aloud), interrupt immediately:
- "Give me the key point."
- "Condense that."
- "What's the number?"
Do NOT let long responses pass without interruption. Pacing discipline is a core interview skill.
Do NOT mention a timer or time limit. Keep it conversational but direct.
Do NOT use courtesy phrases like "Thanks for explaining" or "That makes sense" before or after interrupting.`
  );

  parts.push(
    `HARD CLOSE RESPONSE (internal):
If the user asks for a clear, specific next step AND you are at difficulty level 3:
- Respond with a realistic conditional commitment in character.
- After your response, add this marker on its own line: [HARD_CLOSE_WIN]
Nothing after the marker.`
  );

  return parts.length > 0 ? "\n\n" + parts.join("\n\n") : "";
}

export function detectCallEnd(responseText: string): boolean {
  return responseText.includes(CALL_END_MARKER);
}

export function detectHardCloseWin(responseText: string): boolean {
  return responseText.includes("[HARD_CLOSE_WIN]");
}

export function cleanResponseText(text: string): string {
  return text
    .replace(/\[CALL_ENDED\]/g, "")
    .replace(/\[HARD_CLOSE_WIN\]/g, "")
    .trim();
}

export { CALL_END_MARKER };
