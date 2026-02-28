import { Mic } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { VOICE_INTERVIEW_ENABLED } from "./voiceInterviewDesign";

interface VoiceModeBannerProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Hidden toggle for Voice Interview Beta.
 * Only renders when VOICE_INTERVIEW_ENABLED = true.
 */
export function VoiceModeBanner({ enabled, onToggle }: VoiceModeBannerProps) {
  if (!VOICE_INTERVIEW_ENABLED) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <Mic className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          Voice Interview
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
  );
}
