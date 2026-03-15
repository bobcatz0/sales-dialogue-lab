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

// ---------------------------------------------------------------------------
// Rich voice feedback result — used by VoiceFeedbackPanel
// ---------------------------------------------------------------------------

/** One scored category with a brief human-readable explanation. */
export interface VoiceCategoryScore {
  name: string;
  score: number; // 0-100
  explanation: string;
}

/**
 * Full voice feedback result object.
 * Produced by buildVoiceFeedbackResult and consumed by VoiceFeedbackPanel.
 */
export interface VoiceFeedbackResult {
  finalScore: number;
  rank: string;
  percentile: number;
  summaryLine: string;
  categoryBreakdown: VoiceCategoryScore[];
  strongestCategory: string;
  strongestExplanation: string;
  weakestCategory: string;
  weakestExplanation: string;
  coachingTip: string;
  transcript: string;
  personalBest: number | null;
  previousBest: number | null;
  improvementDelta: number | null;
}

const VOICE_RANK_TABLE: { min: number; rank: string; percentile: number }[] = [
  { min: 90, rank: "Elite", percentile: 95 },
  { min: 75, rank: "Pro", percentile: 82 },
  { min: 60, rank: "Developing", percentile: 62 },
  { min: 45, rank: "Inconsistent", percentile: 40 },
  { min: 0,  rank: "Needs Work",  percentile: 20 },
];

function getVoiceRank(score: number): { rank: string; percentile: number } {
  return VOICE_RANK_TABLE.find((r) => score >= r.min) ?? VOICE_RANK_TABLE[VOICE_RANK_TABLE.length - 1];
}

function buildCategoryExplanation(name: string, score: number, metrics: VoiceMetrics): string {
  const { fillerFrequency, verbalPace } = metrics;
  switch (name) {
    case "Clarity":
      if (fillerFrequency <= 1) return `${fillerFrequency} fillers/min — clean, confident delivery.`;
      if (fillerFrequency <= 3) return `${fillerFrequency} fillers/min — small reduction will sharpen this.`;
      return `${fillerFrequency} fillers/min — high filler rate is the main drag here.`;
    case "Confidence":
      if (score >= 80) return "Steady delivery with no major hesitation signals.";
      if (score >= 60) return "Some hedging or filler detected — aim for more deliberate pacing.";
      return "High filler or erratic pauses projected uncertainty.";
    case "Pace":
      if (verbalPace >= 140 && verbalPace <= 170) return `${verbalPace} wpm — ideal SDR range (140–170).`;
      if (verbalPace > 170 && verbalPace <= 200) return `${verbalPace} wpm — slightly fast. Slow down for impact.`;
      if (verbalPace > 200) return `${verbalPace} wpm — too fast. The listener can't keep up.`;
      if (verbalPace > 0) return `${verbalPace} wpm — below target. Pick up energy and tempo.`;
      return "Pace data unavailable for this session.";
    case "Conciseness":
      if (score >= 85) return "Tight delivery — you led with your point and stayed there.";
      if (fillerFrequency > 5) return "Filler words are padding your response length significantly.";
      if (score >= 60) return "Acceptable length — try leading with the main point first.";
      return "Responses ran long or indirect. Use: point → proof → done.";
    case "Response Quality":
      if (score >= 85) return "Structured answers — clear point, proof, and landing.";
      if (score >= 65) return "Decent structure. Work on a cleaner, definitive close.";
      return "Answers lacked direction. Use: point → proof → impact → stop.";
    case "Verbal Readiness":
      if (score >= 80) return "Strong composite across all six delivery dimensions.";
      if (score >= 60) return "Solid baseline — focus exclusively on your weakest area above.";
      return "Multiple delivery dimensions need consistent work.";
    default:
      return "";
  }
}

function buildSummaryLine(strongest: VoiceSkillScore, weakest: VoiceSkillScore): string {
  const s = strongest.name;
  const w = weakest.name;
  if (weakest.score < 45) {
    return `${s} was your standout area. ${w} (${weakest.score}) is the critical gap — address that first.`;
  }
  if (weakest.score < 65) {
    return `${s} carried this session. Tightening ${w.toLowerCase()} will move you to the next tier.`;
  }
  return `Consistent across categories. ${s} led the way — keep refining ${w.toLowerCase()} for top-tier delivery.`;
}

/**
 * Build a rich VoiceFeedbackResult from session metrics and history.
 *
 * @param metrics         - Aggregated voice metrics for the session.
 * @param transcript      - The user's spoken turns joined as a single string.
 * @param previousBest    - The best voice score achieved for this role before this session,
 *                          or null if this is their first session on this role.
 */
export function buildVoiceFeedbackResult(
  metrics: VoiceMetrics,
  transcript: string,
  previousBest: number | null = null,
): VoiceFeedbackResult {
  const review = buildVoiceReview(metrics);
  const { rank, percentile } = getVoiceRank(review.voiceScore);

  const categoryBreakdown: VoiceCategoryScore[] = review.categories.map((cat) => ({
    name: cat.name,
    score: cat.score,
    explanation: buildCategoryExplanation(cat.name, cat.score, metrics),
  }));

  const summaryLine = buildSummaryLine(review.strongestCategory, review.weakestCategory);

  const strongestCat = categoryBreakdown.find((c) => c.name === review.strongestCategory.name)!;
  const weakestCat   = categoryBreakdown.find((c) => c.name === review.weakestCategory.name)!;

  const improvementDelta = previousBest !== null ? review.voiceScore - previousBest : null;
  const personalBest = previousBest !== null ? Math.max(previousBest, review.voiceScore) : review.voiceScore;

  return {
    finalScore: review.voiceScore,
    rank,
    percentile,
    summaryLine,
    categoryBreakdown,
    strongestCategory: review.strongestCategory.name,
    strongestExplanation: strongestCat?.explanation ?? "",
    weakestCategory: review.weakestCategory.name,
    weakestExplanation: weakestCat?.explanation ?? "",
    coachingTip: review.coachingTip,
    transcript,
    personalBest,
    previousBest,
    improvementDelta,
  };
}
