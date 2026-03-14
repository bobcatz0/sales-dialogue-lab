import type { RankTier } from "@/lib/elo";

export interface CertificationStage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  env: string;
  role: string;
  duration: string;
  framework: string;
  evaluationCriteria: string[];
  weight: number; // percentage weight toward final score
}

export interface CertificationTrack {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  stages: CertificationStage[];
  passingScore: number;
  certificationTiers: CertificationTier[];
}

export interface CertificationTier {
  name: string;
  minScore: number;
  rank: RankTier;
  color: string;
  icon: string;
}

export interface StageScore {
  stageId: string;
  score: number;
  completedAt: string;
}

export interface CertificationAttempt {
  id: string;
  trackId: string;
  userId: string;
  stageScores: StageScore[];
  currentStageIndex: number;
  status: "in_progress" | "completed" | "failed";
  finalScore: number | null;
  certificationLevel: string | null;
  startedAt: string;
  completedAt: string | null;
}

export const CERTIFICATION_TIERS: CertificationTier[] = [
  { name: "Certified Rookie", minScore: 0, rank: "Rookie", color: "text-muted-foreground", icon: "🔰" },
  { name: "Certified Prospector", minScore: 55, rank: "Prospector", color: "text-orange-400", icon: "⛏️" },
  { name: "Certified Closer", minScore: 65, rank: "Closer", color: "text-primary", icon: "🤝" },
  { name: "Certified Operator", minScore: 75, rank: "Operator", color: "text-blue-400", icon: "⚡" },
  { name: "Certified Rainmaker", minScore: 85, rank: "Rainmaker", color: "text-yellow-400", icon: "🌧️" },
  { name: "Certified Sales Architect", minScore: 93, rank: "Sales Architect", color: "text-purple-400", icon: "👑" },
];

export const SALES_CERTIFICATION_TRACK: CertificationTrack = {
  id: "sales-certification-v1",
  title: "Sales Certification",
  subtitle: "Prove your sales ability across all core competencies",
  description: "Complete a structured 4-stage interview simulation covering cold calling, objection handling, discovery, and closing. Your weighted scores determine your certification level.",
  passingScore: 55,
  certificationTiers: CERTIFICATION_TIERS,
  stages: [
    {
      id: "cert-cold-call",
      title: "Cold Call Opening",
      subtitle: "Hook the prospect in 30 seconds",
      description: "Open a cold call to a busy VP who doesn't know you. You have one chance to earn a conversation. Demonstrate confidence, relevance, and a compelling hook.",
      env: "cold-call",
      role: "b2b-prospect",
      duration: "~4 min",
      framework: "Cold Call Structure",
      weight: 20,
      evaluationCriteria: [
        "Permission-based opener",
        "Trigger event or name-drop",
        "Value proposition clarity",
        "Pattern interrupt technique",
        "Appropriate energy and pacing",
      ],
    },
    {
      id: "cert-objection",
      title: "Objection Handling",
      subtitle: "Navigate resistance without losing the deal",
      description: "A skeptical buyer hits you with real objections — price, timing, competitor preference, and 'just send me an email.' Handle each with composure and strategic reframing.",
      env: "cold-call",
      role: "skeptical-buyer",
      duration: "~5 min",
      framework: "Objection Structure",
      weight: 30,
      evaluationCriteria: [
        "Anchor — acknowledge without conceding",
        "Shift — reframe to value",
        "Resolve — provide specific proof",
        "Step — advance to next action",
        "Composure under pressure",
      ],
    },
    {
      id: "cert-discovery",
      title: "Discovery Questions",
      subtitle: "Uncover pain, qualify the deal",
      description: "Run a discovery call with a guarded VP of Operations. Uncover their real problems, quantify impact, and map the buying process — without sounding like a checklist robot.",
      env: "cold-call",
      role: "b2b-prospect",
      duration: "~5 min",
      framework: "Discovery Structure",
      weight: 30,
      evaluationCriteria: [
        "Situation — context mapping",
        "Problem — pain identification",
        "Impact — quantify consequences",
        "Ask — commitment to next steps",
        "Natural conversation flow",
      ],
    },
    {
      id: "cert-closing",
      title: "Closing",
      subtitle: "Seal the deal with conviction",
      description: "The prospect is warm but hasn't committed. Navigate final hesitations, create urgency without pressure, and secure a definitive commitment — meeting, trial, or signature.",
      env: "enterprise",
      role: "decision-maker",
      duration: "~5 min",
      framework: "Closing Techniques",
      weight: 20,
      evaluationCriteria: [
        "Trial close timing",
        "Urgency without desperation",
        "Handle last-minute objections",
        "Clear call-to-action",
        "Mutual commitment framing",
      ],
    },
  ],
};

export function getCertificationLevel(score: number): CertificationTier {
  const tiers = [...CERTIFICATION_TIERS].reverse();
  return tiers.find((t) => score >= t.minScore) ?? CERTIFICATION_TIERS[0];
}

export function calculateFinalScore(stages: CertificationStage[], stageScores: StageScore[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const stage of stages) {
    const result = stageScores.find((s) => s.stageId === stage.id);
    if (result) {
      weightedSum += result.score * (stage.weight / 100);
      totalWeight += stage.weight / 100;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
