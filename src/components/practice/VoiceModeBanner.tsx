import { Mic, MicOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VOICE_INTERVIEW_ENABLED } from "./voiceInterviewDesign";

interface VoiceModeBannerProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  /** When true, voice is mandatory (cold call) — no toggle shown */
  locked?: boolean;
}

/**
 * Tab-style Text Mode / Voice Mode selector.
 * Only renders when VOICE_INTERVIEW_ENABLED = true.
 */
export function VoiceModeBanner({ enabled, onToggle, locked }: VoiceModeBannerProps) {
  if (!VOICE_INTERVIEW_ENABLED) return null;

  if (locked) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Mic className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">Voice Required</span>
          <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">Required</Badge>
        </div>
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          Cold Call mode uses voice only. Microphone access is required to begin.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Practice Mode
      </p>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {/* Text Mode tab */}
        <button
          onClick={() => onToggle(false)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            !enabled
              ? "bg-muted text-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MicOff className="h-3 w-3" />
          Text Mode
        </button>
        {/* Voice Mode tab */}
        <button
          onClick={() => onToggle(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-l border-border transition-colors ${
            enabled
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-3 w-3" />
          Voice Mode
          <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 leading-none">
            Beta
          </Badge>
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground mt-1.5 leading-relaxed">
        {enabled
          ? "Speak your answers out loud. Scores pacing, clarity, and filler words."
          : "Type your responses. Scores structure, specificity, and recovery."}
      </p>
    </div>
  );
}
