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

  pauseErratic: "Inconsistent pausing signals uncertainty.",
  pauseNatural: "Natural pause rhythm — sounds composed.",

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
  pauseVariance: {
    consistent: 0.3, // seconds std dev
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

  // Pause consistency
  if (metrics.pauseLengthVariance > T.pauseVariance.erratic) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.pauseErratic);
  } else if (metrics.pauseLengthVariance <= T.pauseVariance.consistent && metrics.pauseLengthAvg > 0) {
    feedback.push(VOICE_FEEDBACK_TEMPLATES.pauseNatural);
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
export const VOICE_INTERVIEW_ENABLED = false;
