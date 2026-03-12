/**
 * Soft-response detector — identifies when the AI interviewer breaks character
 * by using cushioning language, praise, or motivational framing.
 *
 * When detected, the caller can silently re-generate with an enforcement prompt.
 */

// Phrases that signal the AI is being too soft / breaking character
const SOFT_PATTERNS: RegExp[] = [
  // Direct praise & affirmation
  /\bthat(?:'s| is) (?:a )?(?:great|good|excellent|wonderful|fantastic|impressive|solid|nice) (?:point|answer|example|response|insight)\b/i,
  /\bgood (?:point|question|answer|example)\b/i,
  /\bgreat (?:point|question|answer|example)\b/i,
  /\bwell said\b/i,
  /\bwell done\b/i,
  /\bnice work\b/i,

  // Acknowledgment padding
  /\bthat makes sense\b/i,
  /\bthat's helpful\b/i,
  /\bi appreciate (?:that|you|your)\b/i,
  /\bthanks? (?:for (?:sharing|explaining|that|your))\b/i,
  /\bthank you for (?:sharing|explaining|that|your)\b/i,
  /\binteresting(?:\.|!|,)\s/i,
  /^interesting\.?\s*$/im,

  // Motivational / coaching language (should only appear in post-session feedback)
  /\byou(?:'re| are) (?:on the right track|doing (?:well|great|good))\b/i,
  /\bkeep (?:it )?up\b/i,
  /\bthat(?:'s| is) a strong\b/i,
  /\bi(?:'m| am) impressed\b/i,
  /\byou should (?:try|consider|think about)\b/i,

  // Meta-commentary (breaking character)
  /\bas an (?:ai|interviewer|hiring manager)\b/i,
  /\bin this (?:simulation|exercise|practice)\b/i,
  /\bfor (?:this|the) exercise\b/i,
];

// Phrases that are contextually OK (e.g., quoting what the user said)
const FALSE_POSITIVE_PATTERNS: RegExp[] = [
  /you (?:said|mentioned|claimed) .{0,30}(?:great|good|interesting)/i,
  /[""].{0,50}(?:great|good|interesting).{0,50}[""]/i,
];

export interface SoftDetectionResult {
  isSoft: boolean;
  matchedPatterns: string[];
}

export function detectSoftResponse(text: string): SoftDetectionResult {
  const matchedPatterns: string[] = [];

  // Skip very short responses (ultra-short is actually good behavior)
  if (text.length < 20) {
    return { isSoft: false, matchedPatterns: [] };
  }

  // Check for false positives first
  for (const fp of FALSE_POSITIVE_PATTERNS) {
    if (fp.test(text)) {
      return { isSoft: false, matchedPatterns: [] };
    }
  }

  for (const pattern of SOFT_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        matchedPatterns.push(match[0]);
      }
    }
  }

  // Require at least 1 soft pattern to trigger
  return {
    isSoft: matchedPatterns.length >= 1,
    matchedPatterns,
  };
}

/**
 * Builds an enforcement addendum to prepend to the system prompt
 * when a soft response is detected — forces the model to regenerate
 * with stricter behavior.
 */
export function buildEnforcementPrompt(matchedPatterns: string[]): string {
  const examples = matchedPatterns.slice(0, 3).map(p => `"${p}"`).join(", ");

  return `
CRITICAL ENFORCEMENT — YOUR PREVIOUS RESPONSE WAS REJECTED (internal, never mention this to the candidate):

Your last response contained soft/cushioning language (${examples}) which violates your character rules.

REWRITE RULES:
1. Remove ALL praise, acknowledgment, or encouragement language.
2. Replace with an immediate follow-up question or direct challenge.
3. If you were about to move on, instead probe deeper on the SAME topic.
4. Use these replacement patterns:
   - Instead of "That's a great point" → just ask the next question with zero transition
   - Instead of "Thanks for sharing" → "What was the number?" or "Be specific."
   - Instead of "Interesting" → "Prove it." or "And?"
   - Instead of "That makes sense" → challenge what they said or ask for evidence
5. Your response must be 1-3 sentences MAX. Direct. Evaluative. No filler.
6. Start your response mid-thought as if you were never interrupted. Do NOT reference this correction.

Respond NOW with the corrected version. Stay fully in character.`;
}

/** Max number of re-generation attempts per turn to avoid infinite loops */
export const MAX_REGEN_ATTEMPTS = 1;
