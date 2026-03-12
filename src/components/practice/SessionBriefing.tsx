import { motion } from "framer-motion";
import { Target, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Environment } from "./environments";

interface SessionBriefingProps {
  env: Environment;
  roleTitle: string;
  personalityLabel: string;
  personalityIcon: string;
  onBegin: () => void;
}

const ENV_GOALS: Record<string, string> = {
  interview: "Demonstrate your experience and handling objections.",
  "cold-call": "Open strong, handle resistance, and book the meeting.",
  enterprise: "Navigate complex stakeholder dynamics and objections.",
  "final-round": "Defend your metrics, maintain composure under pressure.",
};

export function SessionBriefing({ env, roleTitle, personalityLabel, personalityIcon, onBegin }: SessionBriefingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex items-center justify-center h-full px-4 py-8"
    >
      <div className="max-w-sm w-full space-y-5 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
          className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
        >
          <env.icon className="h-7 w-7 text-primary" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-1"
        >
          <h3 className="font-heading text-lg font-bold text-foreground">
            {env.title} Simulation
          </h3>
          <p className="text-xs text-muted-foreground">{env.subtitle}</p>
        </motion.div>

        {/* Details grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-elevated p-4 space-y-3 text-left"
        >
          <div className="flex items-center gap-2.5">
            <Target className="h-3.5 w-3.5 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Scenario</p>
              <p className="text-xs font-semibold text-foreground">{roleTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-base shrink-0 w-3.5 text-center">{personalityIcon}</span>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Interviewer</p>
              <p className="text-xs font-semibold text-foreground">{personalityLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Questions</p>
              <p className="text-xs font-semibold text-foreground">~6 questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Goal</p>
              <p className="text-xs text-foreground">{ENV_GOALS[env.id] ?? "Complete the scenario."}</p>
            </div>
          </div>
        </motion.div>

        {/* Begin button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="hero"
            size="lg"
            className="w-full gap-2 py-5 text-base"
            onClick={onBegin}
          >
            Begin Interview
          </Button>
          <p className="text-[10px] text-muted-foreground mt-2">
            Your score will be calculated after the session.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
