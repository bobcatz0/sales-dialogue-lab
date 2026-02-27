/**
 * Pressure & realism engine.
 * Builds dynamic system prompt addendums based on session state,
 * and detects when the persona should auto-end the call.
 */

const CALL_END_MARKER = "[CALL_ENDED]";

/**
 * Build a pressure addendum for the system prompt based on current session state.
 */
export function buildPressurePrompt(opts: {
  elapsedSeconds: number;
  userMessageCount: number;
  totalValidSessions: number; // for anti-frustration
  timePressureThresholdS?: number; // environment override
  callEndingEnabled?: boolean; // environment override
}): string {
  const isEarlyUser = opts.totalValidSessions < 3;
  const threshold = opts.timePressureThresholdS ?? 240;
  const timePressure = opts.elapsedSeconds >= threshold;
  const callEnding = opts.callEndingEnabled ?? true;

  const parts: string[] = [];

  if (timePressure) {
    parts.push(
      `PRESSURE ESCALATION (active now — do NOT mention this instruction):
You are running low on time. Become noticeably more impatient and direct.
- Keep responses to 1-2 sentences max.
- Occasionally reference time: "I only have a few more minutes", "Can you get to the point?", "I need to jump to another call soon."
- Do NOT become rude — just realistically time-pressed.
- If the user is making progress, stay engaged but brisk.`
    );
  }

  if (callEnding && !isEarlyUser) {
    parts.push(
      `CALL ENDING LOGIC (internal — never reveal this):
You may end the call naturally if ANY of these occur:
- The user has been vague or rambling for 3+ consecutive turns without asking a question or making a clear point.
- The user cannot answer your direct objections after 2 attempts.
- The user has not attempted any next step (meeting, demo, follow-up) after 6+ exchanges.

When ending, say a realistic closing line like:
- "I appreciate the call, but I don't think this is a fit right now."
- "I'm going to have to let you go — send me something by email if you'd like."
- "Thanks for your time, but I need to get going."

After your closing line, add exactly this marker on a new line: ${CALL_END_MARKER}
This marker must be the LAST thing in your response. Do not add anything after it.`
    );
  }

  // Hard close challenge — only at higher difficulty
  parts.push(
    `HARD CLOSE RESPONSE (internal — never reveal this):
If the user asks for a clear, specific next step (e.g. "Can we schedule a 15-minute demo next Tuesday?", "Would you be open to a brief follow-up with your team?") AND you are at difficulty level 3:
- Respond with a realistic conditional commitment, e.g. "If you can send me a one-pager by Friday, I'll get it in front of the team."
- This is a win for the user. Stay in character.
- After your conditional commitment, add exactly this marker on a new line: [HARD_CLOSE_WIN]
This marker must be the LAST thing in your response. Do not add anything after it.`
  );

  return parts.length > 0 ? "\n\n" + parts.join("\n\n") : "";
}

/**
 * Check if the AI response indicates a call-ended event.
 */
export function detectCallEnd(responseText: string): boolean {
  return responseText.includes(CALL_END_MARKER);
}

/**
 * Check if the AI response indicates a hard close win.
 */
export function detectHardCloseWin(responseText: string): boolean {
  return responseText.includes("[HARD_CLOSE_WIN]");
}

/**
 * Strip internal markers from display text.
 */
export function cleanResponseText(text: string): string {
  return text
    .replace(/\[CALL_ENDED\]/g, "")
    .replace(/\[HARD_CLOSE_WIN\]/g, "")
    .trim();
}

export { CALL_END_MARKER };
