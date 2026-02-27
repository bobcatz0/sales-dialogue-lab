export interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

export interface SkillScore {
  name: string;
  score: number; // 0-100
}

export type EvaluatorStyle = "analytical" | "results-oriented" | "behavioral";

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
}
