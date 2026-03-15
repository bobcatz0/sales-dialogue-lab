import { motion, AnimatePresence } from "framer-motion";
import { Mic, MessageSquareText, Sparkles, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceOnboardingModalProps {
  open: boolean;
  onStart: () => void;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Mic,
    label: "Tap the mic and speak your response",
  },
  {
    icon: MessageSquareText,
    label: "We transcribe your answer automatically",
  },
  {
    icon: Sparkles,
    label: "The AI responds in voice and scores your performance",
  },
];

const ONBOARDING_KEY = "salescalls_voice_onboarded";

export function hasSeenVoiceOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function markVoiceOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {}
}

export function VoiceOnboardingModal({ open, onStart, onDismiss }: VoiceOnboardingModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="card-elevated w-full max-w-sm mx-4 p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <Mic className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              How Voice Mode Works
            </h2>
          </div>
          <p className="text-xs text-muted-foreground text-center mb-5">
            Practice realistic sales conversations using your voice.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-5">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <step.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground leading-snug">{step.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2 mb-5">
            <Headphones className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Best with headphones and a quiet room.
            </p>
          </div>

          {/* Actions */}
          <Button
            className="w-full h-10 text-sm gap-2"
            onClick={() => {
              markVoiceOnboarded();
              onStart();
            }}
          >
            <Mic className="h-4 w-4" />
            Start Voice Practice
          </Button>
          <button
            onClick={() => {
              markVoiceOnboarded();
              onDismiss();
            }}
            className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground w-full text-center mt-2 transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
