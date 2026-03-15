import { Phone, Mail, RotateCcw, Search, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface VoiceScenario {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  goal: string;
  env: string;
  role: string;
  icon: LucideIcon;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  scoredOn: string[];
}

export const VOICE_SCENARIOS: VoiceScenario[] = [
  {
    id: "voice-cold-call-opener",
    title: "Cold Call Opener",
    subtitle: "Nail the first 10 seconds",
    prompt: 'Prospect answers the phone: "Hello?"',
    goal: "Open the call clearly and earn permission to continue.",
    env: "cold-call",
    role: "b2b-prospect",
    icon: Phone,
    duration: "~1 min",
    difficulty: "Beginner",
    scoredOn: ["Clarity", "Confidence", "Pace"],
  },
  {
    id: "voice-send-email",
    title: "Send Me an Email",
    subtitle: "Survive the brush-off",
    prompt: 'Prospect says: "Just send me an email."',
    goal: "Respond without sounding pushy and keep the conversation alive.",
    env: "cold-call",
    role: "b2b-prospect",
    icon: Mail,
    duration: "~1 min",
    difficulty: "Beginner",
    scoredOn: ["Verbal Readiness", "Conciseness", "Confidence"],
  },
  {
    id: "voice-existing-vendor",
    title: "Existing Vendor Objection",
    subtitle: "Reopen a closed door",
    prompt: 'Prospect says: "We already work with another vendor."',
    goal: "Reopen the conversation and create curiosity.",
    env: "cold-call",
    role: "skeptical-buyer",
    icon: RotateCcw,
    duration: "~1 min",
    difficulty: "Intermediate",
    scoredOn: ["Response Quality", "Confidence", "Clarity"],
  },
  {
    id: "voice-discovery-followup",
    title: "Discovery Follow-Up",
    subtitle: "Avoid the generic pitch",
    prompt: 'Prospect says: "So what exactly does your company do?"',
    goal: "Avoid a generic pitch and guide the conversation better.",
    env: "cold-call",
    role: "b2b-prospect",
    icon: Search,
    duration: "~1 min",
    difficulty: "Intermediate",
    scoredOn: ["Conciseness", "Response Quality", "Pace"],
  },
  {
    id: "voice-interview-pressure",
    title: "Interview Pressure Question",
    subtitle: "Stand out under scrutiny",
    prompt: 'Interviewer says: "Why should we hire you over other candidates?"',
    goal: "Answer clearly, confidently, and with specifics.",
    env: "interview",
    role: "hiring-manager",
    icon: Briefcase,
    duration: "~2 min",
    difficulty: "Advanced",
    scoredOn: ["Clarity", "Confidence", "Response Quality"],
  },
];
