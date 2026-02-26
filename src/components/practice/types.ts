export interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

export interface Feedback {
  score: number;
  rank: string;
  strengths: string[];
  improvements: string[];
  nextDrill: string;
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
