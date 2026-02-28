import { Mic } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { VOICE_INTERVIEW_ENABLED } from "./voiceInterviewDesign";

interface VoiceModeBannerProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Toggle for Voice Interview Beta.
 * Only renders when VOICE_INTERVIEW_ENABLED = true.
 */
export function VoiceModeBanner({ enabled, onToggle }: VoiceModeBannerProps) {
  if (!VOICE_INTERVIEW_ENABLED) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            Voice Mode
          </span>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
            Beta
          </Badge>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label="Toggle voice interview mode"
        />
      </div>
      <p className="text-[9px] text-muted-foreground leading-relaxed">
        Practice speaking out loud. Adds pacing + filler-word feedback.
      </p>
    </div>
  );
}
