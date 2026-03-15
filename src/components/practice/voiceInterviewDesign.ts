/**
 * ============================================================
 * PHASE 2 — Voice Interview Beta (DESIGN ONLY — NOT LIVE)
 * ============================================================
 *
 * Status: DESIGN SPEC — Do not activate until text v1 validated.
 * Mode:   Optional toggle, text remains default.
 *
 * ============================================================
 * FLOW ARCHITECTURE
 * ============================================================
 *
 * 1. AI generates interview question (text).
 * 2. AI speaks question via ElevenLabs TTS (existing edge function).
 * 3. User records spoken response (Web Speech API / ElevenLabs STT).
 * 4. Speech-to-text transcribes response into text.
 * 5. Existing evaluation engine (roleplay-feedback) runs on transcript.
 * 6. Voice-specific scoring layer appends additional metrics.
 *
 * No real-time interrupt in Phase 2 Beta:
 *   - AI waits for full response completion.
 *   - No mid-sentence interruption.
 *   - Simpler, more stable architecture.
 *
 * ============================================================
 * VOICE-SPECIFIC METRICS
 * ============================================================
 */

export interface VoiceMetrics {
  /** Filler words detected (uh, um, like, you know, so, basically) */
  fillerFrequency: number; // count per minute

  /** Words per minute — ideal SDR range: 140-170 wpm */
  verbalPace: number;

  /** Total response duration in seconds */
  responseDuration: number;

  /** Average pause length between phrases (seconds) */
  pauseLengthAvg: number;

  /** Consistency of pause lengths — lower = more consistent */
  pauseLengthVariance: number;
}

/**
 * ============================================================
 * VOICE-SPECIFIC FEEDBACK TEMPLATES
 * ============================================================
 *
 * These map to scoring thresholds. Tone: direct, no fluff.
 */

export const VOICE_FEEDBACK_TEMPLATES = {
  fillerHigh: "Filler phrases reduced perceived confidence.",
  fillerLow: "Clean verbal delivery — minimal filler detected.",

  paceRushed: "Response pacing rushed under pressure.",
  paceSlow: "Verbal pace too slow — lost interviewer attention.",
  paceIdeal: "Strong verbal pacing maintained throughout.",

  durationShort: "Response too brief — lacks substance for the question.",
  durationLong: "Response ran long — tighten delivery.",
  durationIdeal: "Response length appropriate for question complexity.",

  pauseErratic: "Long hesitation under pressure affected clarity.",
  pauseNatural: "Your pause control was steady.",
  pauseRushed: "Responses felt rushed with minimal thinking space.",
  pauseLongFrequent: "Frequent pauses over 3 seconds signaled uncertainty.",

  structureStrong: "Strong verbal structure detected.",
  structureWeak: "Response lacked clear verbal structure.",
} as const;

/**
 * ============================================================
 * SCORING THRESHOLDS
 * ============================================================
 */

export const VOICE_THRESHOLDS = {
  filler: {
    good: 2,   // ≤2 per minute
    warning: 5, // 3-5 per minute
    // >5 = high
  },
  pace: {
    slow: 120,  // wpm
    idealMin: 140,
    idealMax: 170,
    rushed: 190,
  },
  duration: {
    tooShort: 15, // seconds
    idealMin: 30,
    idealMax: 120,
    tooLong: 150,
  },
  pause: {
    naturalMax: 1.5,       // seconds — not penalized
    longThreshold: 3.0,    // seconds — flagged if frequent
    longThresholdFinal: 2.5, // tighter in Final Round
    rushedMax: 0.4,        // avg pause below this = rushed
  },
  pauseVariance: {
    consistent: 0.4, // seconds std dev — relaxed from 0.3
    erratic: 0.8,
  },
} as const;

/**
 * ============================================================
 * FILLER WORD DETECTION
 * ============================================================
 */

export const FILLER_WORDS = [
  "uh", "um", "like", "you know", "so", "basically",
  "actually", "literally", "right", "I mean", "kind of",
  "sort of", "honestly", "obviously",
] as const;

/**
 * Analyze transcript for voice-specific metrics.
 * This runs CLIENT-SIDE on the STT output before sending to eval engine.
 */
export function analyzeVoiceMetrics(
  transcript: string,
  durationSeconds: number
): VoiceMetrics {
  const words = transcript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const minutes = durationSeconds / 60;

  // Filler detection
  const lowerTranscript = transcript.toLowerCase();
  let fillerCount = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lowerTranscript.match(regex);
    if (matches) fillerCount += matches.length;
  }

  return {
    fillerFrequency: minutes > 0 ? Math.round(fillerCount / minutes) : 0,
    verbalPace: minutes > 0 ? Math.round(wordCount / minutes) : 0,
    responseDuration: Math.round(durationSeconds),
    pauseLengthAvg: 0,      // Requires audio analysis — placeholder
    pauseLengthVariance: 0,  // Requires audio analysis — placeholder
  };
}

/**
 * Generate voice-specific feedback lines based on metrics.
 */
export function generateVoiceFeedback(metrics: VoiceMetrics): string[] {
  const feedback: string[] = [];
  const T = VOICE_THRESHOLDS;

  // Filler
  if (metrics.fillerFrequency > T.filler.warning) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.fillerHigh);
  } else if (metrics.fillerFrequency <= T.filler.good) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.fillerLow);
  }

  // Pace
  if (metrics.verbalPace > T.pace.rushed) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.paceRushed);
  } else if (metrics.verbalPace < T.pace.slow) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.paceSlow);
  } else if (metrics.verbalPace >= T.pace.idealMin && metrics.verbalPace <= T.pace.idealMax) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.paceIdeal);
  }

  // Duration
  if (metrics.responseDuration < T.duration.tooShort) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.durationShort);
  } else if (metrics.responseDuration > T.duration.tooLong) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.durationLong);
  }

  // Pause analysis — ignore natural pauses under threshold
  if (metrics.pauseLengthAvg > 0) {
    if (metrics.pauseLengthAvg < T.pause.rushedMax) {
      feedback.push(VOICE_FEEDBACK_TEMPLATES.pauseRushed);
    } else if (metrics.pauseLengthAvg > T.pause.longThreshold) {
      feedback.push(VOICE_FEEDBACK_TEMPLATES.pauseLongFrequent);
    } else if (metrics.pauseLengthVariance > T.pauseVariance.erratic) {
      feedback.push(VOICE_FEEDBACK_TEMPLATES.pauseErratic);
    } else if (
      metrics.pauseLengthAvg <= T.pause.naturalMax &&
      metrics.pauseLengthVariance <= T.pauseVariance.consistent
    ) {
      feedback.push(VOICE_FEEDBACK_TEMPLATES.pauseNatural);
    }
  }

  return feedback;
}

/**
 * ============================================================
 * ACTIVATION FLAG
 * ============================================================
 *
 * Phase 2 is hidden by default. Set to true only when ready
 * for controlled beta testing.
 */
export const VOICE_INTERVIEW_ENABLED = true;

/**
 * ============================================================
 * VOICE PERFORMANCE REVIEW
 * ============================================================
 *
 * Computes 6 voice-specific scoring categories from VoiceMetrics.
 * Used to replace raw metric display with a structured review.
 */

export interface VoiceSkillScore {
  name: string;
  score: number; // 0-100
}

export interface VoiceReview {
  voiceScore: number;
  categories: VoiceSkillScore[];
  strongestCategory: VoiceSkillScore;
  weakestCategory: VoiceSkillScore;
  coachingTip: string;
}

const VOICE_COACHING_TIPS: Record<string, string> = {
  "Clarity": "Cut filler words (uh, um, like, basically). Pause instead of filling — silence signals command of the room.",
  "Confidence": "Remove hedging language and hesitation fillers. Consistent pacing reads as prepared and in control.",
  "Pace": "Target 140–170 words per minute. Rushing signals nerves; deliberately slowing down creates impact.",
  "Conciseness": "Lead with your point, then one supporting detail. Every word should earn its place — cut verbal padding.",
  "Response Quality": "Structure each answer: point → proof → impact. Avoid trailing off — land each response cleanly.",
  "Verbal Readiness": "Start with one change: reduce fillers first. Once that's consistent, focus on pacing, then structure.",
};

function computeCategories(metrics: VoiceMetrics): VoiceSkillScore[] {
  const { fillerFrequency, verbalPace, pauseLengthAvg, pauseLengthVariance } = metrics;

  // Clarity — driven primarily by filler word frequency
  const clarity = Math.max(20, Math.min(100, 100 - fillerFrequency * 10));

  // Confidence — filler + erratic pauses both signal uncertainty
  let confidence = 85;
  if (fillerFrequency > 5) confidence -= 30;
  else if (fillerFrequency > 2) confidence -= 15;
  if (pauseLengthAvg > 0) {
    if (pauseLengthVariance > 0.8) confidence -= 15;
    else if (pauseLengthAvg > 3.0) confidence -= 20;
  }
  confidence = Math.max(20, Math.min(100, confidence));

  // Pace — proximity to ideal 140–170 wpm SDR range
  let pace = 50;
  if (verbalPace > 0) {
    if (verbalPace >= 140 && verbalPace <= 170) pace = 95;
    else if (verbalPace >= 120 && verbalPace < 140) pace = 75;
    else if (verbalPace > 170 && verbalPace <= 190) pace = 75;
    else if (verbalPace >= 100 && verbalPace < 120) pace = 52;
    else if (verbalPace > 190 && verbalPace <= 210) pace = 52;
    else pace = 28;
  }

  // Conciseness — anti-filler + penalize rambling pace
  let conciseness = 80;
  if (fillerFrequency > 5) conciseness -= 25;
  else if (fillerFrequency > 2) conciseness -= 12;
  else if (fillerFrequency <= 1) conciseness += 10;
  if (verbalPace > 0 && verbalPace > 200) conciseness -= 10;
  conciseness = Math.max(20, Math.min(100, conciseness));

  // Response Quality — organized delivery proxy: pace control + low filler
  let quality = 65;
  if (verbalPace >= 140 && verbalPace <= 170) quality += 18;
  else if (verbalPace >= 120 && verbalPace <= 190) quality += 8;
  if (fillerFrequency <= 1) quality += 12;
  else if (fillerFrequency <= 2) quality += 6;
  else if (fillerFrequency > 5) quality -= 15;
  quality = Math.max(20, Math.min(100, quality));

  // Verbal Readiness — weighted composite of all above
  const verbalReadiness = Math.round(
    clarity * 0.2 + confidence * 0.2 + pace * 0.2 + conciseness * 0.15 + quality * 0.25
  );

  return [
    { name: "Clarity", score: Math.round(clarity) },
    { name: "Confidence", score: Math.round(confidence) },
    { name: "Pace", score: Math.round(pace) },
    { name: "Conciseness", score: Math.round(conciseness) },
    { name: "Response Quality", score: Math.round(quality) },
    { name: "Verbal Readiness", score: Math.round(verbalReadiness) },
  ];
}

/**
 * Build a full voice performance review from session metrics.
 * Returns scored categories, strongest/weakest areas, and a coaching tip.
 */
export function buildVoiceReview(metrics: VoiceMetrics): VoiceReview {
  const categories = computeCategories(metrics);

  const strongest = categories.reduce((best, c) => c.score > best.score ? c : best, categories[0]);
  const weakest = categories.reduce((min, c) => c.score < min.score ? c : min, categories[0]);

  // Overall voice score — average of the 6 categories
  const voiceScore = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  );

  const coachingTip = VOICE_COACHING_TIPS[weakest.name] ?? VOICE_COACHING_TIPS["Verbal Readiness"];

  return { voiceScore, categories, strongestCategory: strongest, weakestCategory: weakest, coachingTip };
}
