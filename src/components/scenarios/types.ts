import type { RankTier } from "@/lib/elo";
import type { FrameworkId } from "@/components/practice/types";

export interface ScenarioStage {
  id: string;
  title: string;
  subtitle: string;
  env: string;
  role: string;
  duration: string;
  goal: string;
  evaluationCriteria: string[];
}

export interface ScenarioChain {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: React.ElementType;
  stages: ScenarioStage[];
  totalDuration: string;
  requiredRank?: RankTier;
  framework?: { id: FrameworkId; label: string };
}

export interface StageResult {
  stageId: string;
  score: number;
  completedAt: string;
}

export interface ChainProgress {
  chainId: string;
  stageResults: StageResult[];
  currentStageIndex: number;
  completed: boolean;
  averageScore: number | null;
}
