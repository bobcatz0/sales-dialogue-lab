export interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

export interface SkillScore {
  name: string;
  score: number; // 0-100
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
