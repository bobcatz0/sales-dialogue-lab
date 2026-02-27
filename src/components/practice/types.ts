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
