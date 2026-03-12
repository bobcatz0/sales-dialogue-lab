export interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

export interface SkillScore {
  name: string;
  score: number; // 0-100
}

export type EvaluatorStyle = "analytical" | "results-oriented" | "behavioral";

export type FrameworkId = "bant" | "meddic" | "star" | "spin" | "none";

export interface RubricScore {
  criterion: string;
  weight: string;
  score: number;
  note: string;
}

export interface AnswerComparison {
  question: string;
  userAnswer: string;
  idealAnswer: string;
  gap: string;
}

export interface TimestampedMoment {
  exchangeIndex: number;
  label: string;
  quote: string;
  issue: string;
  suggestedResponse?: string;
}

export interface Feedback {
  score: number;
  rank: string;
  peakDifficulty: number;
  strengths: string[];
  improvements: string[];
  nextDrill: string;
  bestMoment: string;
  skillBreakdown?: SkillScore[];
  trainingRecommendation?: string;
  resumeAlignment?: {
    claimsMatched: boolean;
    metricsDefended: boolean;
    consistencyNote: string;
  };
  evaluatorStyle?: EvaluatorStyle;
  exposureMoments?: ExposureMoment[];
  recoveryAssessment?: RecoveryAssessment;
  criticalWeakness?: CriticalWeakness;
  finalRoundMetrics?: FinalRoundMetrics;
  pacingNote?: string;
  frameworkId?: FrameworkId;
  rubricScores?: RubricScore[];
  answerComparisons?: AnswerComparison[];
  timestampedMoments?: TimestampedMoment[];
  humanReviewScore?: number | null;
}

export interface FinalRoundMetrics {
  pressureResilience: number; // 0-100
  recoveryStrength: number; // 0-100
  composure: number; // 0-100
  performanceDeclined?: boolean;
}

export interface ExposureMoment {
  weakAnswer: string;
  reason: string;
  correction: string;
}

export interface RecoveryAssessment {
  recovered: boolean;
  note: string;
}

export interface CriticalWeakness {
  weakResponse: string;
  credibilityImpact: string;
  recoveryFailure: string;
  correctiveExample: string;
}

export interface SessionRecord {
  id: string;
  roleId: string;
  roleTitle: string;
  score: number;
  rank: string;
  peakDifficulty: number;
  date: string;
  messageCount: number;
  skillBreakdown?: SkillScore[];
  frameworkId?: FrameworkId;
  rubricScores?: RubricScore[];
  scenarioTitle?: string;
}
