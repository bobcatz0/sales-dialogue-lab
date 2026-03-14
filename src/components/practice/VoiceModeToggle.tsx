import { Mic, Keyboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VoiceModeToggleProps {
  mode: "text" | "voice";
  onToggle: (mode: "text" | "voice") => void;
  disabled?: boolean;
  /** Cold call forces voice — no toggle */
  locked?: boolean;
}

export function VoiceModeToggle({
  mode,
  onToggle,
  disabled,
  locked,
}: VoiceModeToggleProps) {
  if (locked) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <Mic className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">Voice Mode</span>
        <Badge variant="default" className="text-[8px] px-1.5 py-0 h-4">
          Required
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        onClick={() => onToggle("text")}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          mode === "text"
            ? "bg-background text-foreground shadow-sm border border-border/50"
            : "text-muted-foreground hover:text-foreground"
        } disabled:opacity-40`}
      >
        <Keyboard className="h-3 w-3" />
        Text Mode
      </button>
      <button
        onClick={() => onToggle("voice")}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
          mode === "voice"
            ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
            : "text-muted-foreground hover:text-foreground"
        } disabled:opacity-40`}
      >
        <Mic className="h-3 w-3" />
        Voice Mode
        <Badge
          variant="secondary"
          className="text-[7px] px-1 py-0 h-3.5 ml-0.5"
        >
          Coming Soon
        </Badge>
      </button>
    </div>
  );
}
