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
}): string {
  const isEarlyUser = opts.totalValidSessions < 3;
  const threshold = opts.timePressureThresholdS ?? 240;
  const timePressure = opts.elapsedSeconds >= threshold;
  const callEnding = opts.callEndingEnabled ?? true;

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
