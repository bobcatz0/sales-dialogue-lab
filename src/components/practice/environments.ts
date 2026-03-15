/**
 * Selling environments — selected before persona.
 * Each environment filters available personas and tunes pressure/scoring.
 */

import { Briefcase, PhoneOutgoing, Building2, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EnvironmentId = "interview" | "cold-call" | "enterprise" | "final-round";

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
    personaIds: ["hiring-manager", "voice-interview-pressure"],
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
    personaIds: ["gatekeeper", "b2b-prospect", "voice-cold-opener", "voice-send-email", "voice-vendor-objection", "voice-discovery-followup"],
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
  {
    id: "final-round",
    title: "Final Round",
    subtitle: "Elevated pressure evaluation",
    description: "Late-stage interview simulation with heightened scrutiny, faster interruptions, and zero tolerance for vague or unstructured answers.",
    icon: Shield,
    personaIds: ["hiring-manager"],
    promptAddendum: `ENVIRONMENT CONTEXT — Final Round Simulation:
This is a FINAL ROUND interview. The candidate has passed earlier stages. Standards are significantly higher.

BEHAVIORAL RULES:
- Interrupt after 2 sentences if no substance has been delivered. Say: "Get to the point." or "What specifically happened?"
- Show visible skepticism toward all metrics. Ask: "How was that measured?", "What was the baseline?", "Who validated that number?"
- If the candidate uses "we" or "the team" even once without clarifying their role, immediately push: "What was YOUR contribution?"
- If an answer runs past 4 sentences, interrupt: "Condense that to one sentence."
- Do NOT volunteer follow-up topics. Force the candidate to drive structure.
- After any weak answer, apply immediate recovery pressure — shorter responses, sharper tone, more direct challenges.
- If performance drops noticeably mid-session, note it internally for the performance report.

EVALUATION WEIGHTS (Final Round):
- Conciseness (25%): Answers must be tight and outcome-driven.
- Ownership (25%): Clear individual contribution, no deflection.
- Structured Thinking (25%): Logical frameworks, clear sequencing.
- Direct Next-Step Framing (15%): Proactive, specific proposals.
- Composure Under Pressure (10%): Maintains professionalism when challenged.

TONE: Serious. Evaluative. Professional. No warmth. No encouragement. No small talk.
This is not a conversation — it is an evaluation.`,
    timePressureThresholdS: 480,
    callEndingEnabled: false,
    difficultyEscalationRate: "fast",
  },
];

export function getEnvironment(id: EnvironmentId): Environment | undefined {
  return ENVIRONMENTS.find((e) => e.id === id);
}
