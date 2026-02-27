import { motion } from "framer-motion";
import { Calendar, Check, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTodayChallenge } from "./dailyChallenge";
import { ENVIRONMENTS } from "./environments";
import { roles } from "./roleData";
import type { EnvironmentId } from "./environments";

interface DailyChallengeCardProps {
  onStart?: (envId: EnvironmentId, personaId: string) => void;
}

export function DailyChallengeCard({ onStart }: DailyChallengeCardProps) {
  const { challenge, completed } = getTodayChallenge();
  const env = ENVIRONMENTS.find((e) => e.id === challenge.environmentId);
  const persona = roles.find((r) => r.id === challenge.personaId);

  if (!env || !persona) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Daily Objective</span>
        </div>
        {completed ? (
          <Badge variant="default" className="text-[10px] gap-1 bg-primary/15 text-primary border-0">
            <Check className="h-3 w-3" />
            Complete
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
            +25 pts
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] text-muted-foreground">
          {env.title} → <span className="text-foreground font-medium">{persona.title}</span>
        </p>
        <p className="text-xs text-foreground font-medium">
          Focus: {challenge.skillFocus}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {challenge.successLabel}
        </p>
      </div>

      {completed ? (
        <p className="text-[10px] text-muted-foreground/70 text-center pt-1">
          Next objective available tomorrow
        </p>
      ) : (
        <button
          onClick={() => onStart?.(challenge.environmentId, challenge.personaId)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1"
        >
          Begin Session
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}
