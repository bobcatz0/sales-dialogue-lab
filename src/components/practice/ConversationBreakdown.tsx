import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, CheckCircle2, XCircle, AlertTriangle, ChevronDown, Lightbulb } from "lucide-react";
import type { TimestampedMoment } from "./types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const LABEL_CONFIG: Record<string, {
  icon: typeof CheckCircle2;
  label: string;
  border: string;
  bg: string;
  badge: string;
  iconColor: string;
}> = {
  strong: {
    icon: CheckCircle2,
    label: "Strong",
    border: "border-primary/20",
    bg: "bg-primary/5",
    badge: "border-primary/20 text-primary bg-primary/10",
    iconColor: "text-primary",
  },
  weak: {
    icon: XCircle,
    label: "Weak",
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    badge: "border-destructive/20 text-destructive bg-destructive/10",
    iconColor: "text-destructive",
  },
  "missed-opportunity": {
    icon: AlertTriangle,
    label: "Missed",
    border: "border-accent-foreground/20",
    bg: "bg-accent-foreground/5",
    badge: "border-accent-foreground/20 text-accent-foreground bg-accent-foreground/10",
    iconColor: "text-accent-foreground",
  },
};

function getConfig(label: string) {
  return LABEL_CONFIG[label] || LABEL_CONFIG["missed-opportunity"];
}

function MomentCard({ moment, index }: { moment: TimestampedMoment; index: number }) {
  const config = getConfig(moment.label);
  const Icon = config.icon;
  const hasSuggestion = !!moment.suggestedResponse && moment.label !== "strong";
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.05 }}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden`}>
          {/* Header */}
          <CollapsibleTrigger className="w-full text-left px-3 py-2.5 flex items-start gap-2 group cursor-pointer">
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Exchange {moment.exchangeIndex}
                </span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${config.badge}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-[11px] text-foreground italic leading-snug">"{moment.quote}"</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-1">{moment.issue}</p>
            </div>

            {hasSuggestion && (
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            )}
          </CollapsibleTrigger>

          {/* Suggested better response */}
          {hasSuggestion && (
            <CollapsibleContent>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="px-3 pb-3 pt-1 border-t border-border/50 mx-2 mb-1"
                  >
                    <div className="flex items-start gap-1.5 mt-2">
                      <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-1">
                          Try This Instead
                        </p>
                        <p className="text-[11px] text-foreground leading-snug">
                          "{moment.suggestedResponse}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    </motion.div>
  );
}

export function ConversationBreakdown({ moments }: { moments: TimestampedMoment[] }) {
  if (!moments || moments.length === 0) return null;

  const sorted = [...moments].sort((a, b) => a.exchangeIndex - b.exchangeIndex);
  const strongCount = sorted.filter((m) => m.label === "strong").length;
  const weakCount = sorted.filter((m) => m.label !== "strong").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <MessageSquare className="h-3 w-3 text-primary" />
          Conversation Breakdown
        </div>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
          {strongCount > 0 && (
            <span className="flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
              {strongCount}
            </span>
          )}
          {weakCount > 0 && (
            <span className="flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
              {weakCount}
            </span>
          )}
        </div>
      </div>

      {/* Timeline connector */}
      <div className="relative space-y-2 pl-1">
        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />
        {sorted.map((moment, i) => (
          <MomentCard key={i} moment={moment} index={i} />
        ))}
      </div>

      {weakCount > 0 && (
        <p className="text-[9px] text-muted-foreground/60 text-center">
          Tap weak moments to see suggested responses
        </p>
      )}
    </div>
  );
}
