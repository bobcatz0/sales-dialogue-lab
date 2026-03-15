import { motion } from "framer-motion";
import { Mic, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VOICE_STARTER_ROLE_IDS } from "./voiceOnboarding";

interface VoiceOnboardingModalProps {
  open: boolean;
  onDismiss: () => void;
}

const WHAT_IT_SCORES = [
  { label: "Clarity", desc: "Filler-word frequency (uh, um, like, basically)." },
  { label: "Pace", desc: "Words per minute — aim for 140–170." },
  { label: "Confidence", desc: "Minimal hedging and hesitation patterns." },
  { label: "Conciseness", desc: "Getting to the point without padding." },
];

const STARTER_LABELS: Record<(typeof VOICE_STARTER_ROLE_IDS)[number], string> = {
  "voice-cold-opener": "Cold Call Opener",
  "voice-send-email": "Send Me an Email",
  "voice-vendor-objection": "Existing Vendor Objection",
};

export function VoiceOnboardingModal({ open, onDismiss }: VoiceOnboardingModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="card-elevated w-full max-w-md mx-auto p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Mic className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground leading-tight">
              Welcome to Voice Mode
            </h2>
            <span className="mt-0.5 inline-block text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Beta
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Speak your answers out loud instead of typing. Voice Mode scores how you actually
          sound — pacing, filler words, confidence — not just what you say.
        </p>

        {/* Scoring categories */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            What gets scored
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {WHAT_IT_SCORES.map((item) => (
              <div key={item.label} className="rounded-md bg-muted/40 border border-border p-2">
                <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                <p className="text-[9px] text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Starter scenarios */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Start with one of these 3 scenarios
          </p>
          <div className="space-y-1.5">
            {VOICE_STARTER_ROLE_IDS.map((id) => (
              <div key={id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs text-foreground">{STARTER_LABELS[id]}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1.5 leading-relaxed">
            More scenarios unlock after your first voice session.
          </p>
        </div>

        {/* Helper tip */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
            Tip: Answer in 1–3 clear sentences. Voice Mode rewards conciseness.
          </p>
        </div>

        {/* Mic note */}
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Microphone required.</span> Your
          browser will ask for permission when you start a session. Audio is processed
          locally for transcription only.
        </p>

        {/* CTA */}
        <Button className="w-full" onClick={onDismiss}>
          <Mic className="h-4 w-4 mr-2" />
          Got It — Start Practicing
        </Button>
      </motion.div>
    </div>
  );
}
