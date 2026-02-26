export interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

export interface Feedback {
  score: number;
  rank: string;
  peakDifficulty: number;
  strengths: string[];
  improvements: string[];
  nextDrill: string;
  bestMoment: string;
}

export interface SessionRecord {
  id: string;
  roleId: string;
  roleTitle: string;
  score: number;
  rank: string;
  date: string;
  messageCount: number;
}
