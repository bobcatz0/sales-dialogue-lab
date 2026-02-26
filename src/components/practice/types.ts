export interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

export interface Feedback {
  overall: string;
  score: number;
  strengths: string[];
  improvements: string[];
  keyMoment: string;
  tip: string;
}

export interface SessionRecord {
  id: string;
  roleId: string;
  roleTitle: string;
  score: number;
  overall: string;
  tip: string;
  date: string; // ISO string
  messageCount: number;
}
