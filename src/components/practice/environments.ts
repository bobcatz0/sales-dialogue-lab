/**
 * Selling environments — selected before persona.
 * Each environment filters available personas and tunes pressure/scoring.
 */

import { Briefcase, PhoneOutgoing, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EnvironmentId = "interview" | "cold-call" | "enterprise";

export interface Environment {
  id: EnvironmentId;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  personaIds: string[];
  /** Extra system prompt addendum for this environment */
  promptAddendum: string;
  /** Pressure tuning */
  timePressureThresholdS: number; // override default 240s
  callEndingEnabled: boolean;
  difficultyEscalationRate: "normal" | "fast";
}

export const ENVIRONMENTS: Environment[] = [
  {
    id: "interview",
    title: "Interview Prep",
    subtitle: "Sales interview training",
    description: "Practice structured responses, professional storytelling, and confident delivery under interview conditions.",
    icon: Briefcase,
    personaIds: ["hiring-manager", "sdr-behavioral", "sdr-coldcall", "sdr-objections"],
    promptAddendum: `ENVIRONMENT CONTEXT — Interview Prep:
This is a sales job interview. Evaluate the candidate on these weighted criteria:
- Clarity of communication (30%): Are answers clear and easy to follow?
- Structure (20%): Does the candidate use frameworks or logical flow (e.g., STAR method)?
- Confidence (20%): Does the candidate sound assured, not defensive or uncertain?
- Specific examples (20%): Does the candidate cite real situations with concrete details?
- Conciseness (10%): Are answers focused, not rambling?
Ask follow-up questions when answers are vague. Do NOT use time-pressure tactics — maintain a professional, conversational pace. Focus on behavioral and situational questions.`,
    timePressureThresholdS: 600,
    callEndingEnabled: false,
    difficultyEscalationRate: "normal",
  },
  {
    id: "cold-call",
    title: "Cold Call",
    subtitle: "Prospecting & outreach training",
    description: "Develop opening clarity, permission-based language, and next-step positioning under immediate resistance.",
    icon: PhoneOutgoing,
    personaIds: ["gatekeeper", "b2b-prospect"],
    promptAddendum: `ENVIRONMENT CONTEXT — Cold Call:
This is an unsolicited outreach call. The prospect did NOT ask for this call. Be immediately guarded and resistant. Evaluate the caller on: opening clarity (first 10 seconds), permission-based language ("Do you have 30 seconds?"), and ability to secure a specific next step quickly. If the caller cannot earn attention in the first 2-3 exchanges, increase resistance sharply.`,
    timePressureThresholdS: 180,
    callEndingEnabled: true,
    difficultyEscalationRate: "fast",
  },
  {
    id: "enterprise",
    title: "Enterprise Selling",
    subtitle: "Complex deal training",
    description: "Handle multi-stakeholder objections, strategic positioning, and executive-level communication in complex deal cycles.",
    icon: Building2,
    personaIds: ["technical-evaluator", "champion"],
    promptAddendum: `ENVIRONMENT CONTEXT — Enterprise Selling:
This is a mid-to-late stage enterprise evaluation. Multiple stakeholders are involved. The conversation requires strategic framing, not just feature pitching. Evaluate the caller on: objection handling depth, strategic positioning (business case, not just product), and executive-level clarity. Difficulty should escalate faster than normal — raise multi-layer objections (technical + budget + timeline) starting from exchange 3.`,
    timePressureThresholdS: 240,
    callEndingEnabled: true,
    difficultyEscalationRate: "fast",
  },
];

export function getEnvironment(id: EnvironmentId): Environment | undefined {
  return ENVIRONMENTS.find((e) => e.id === id);
}
