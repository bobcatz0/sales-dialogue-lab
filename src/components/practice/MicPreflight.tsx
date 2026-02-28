import { useState, useCallback, useEffect } from "react";
import { Mic, MicOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export type MicStatus = "not-requested" | "checking" | "allowed" | "blocked";

interface MicPreflightProps {
  /** Current mic permission status */
  status: MicStatus;
  /** Called when user clicks to request mic access */
  onRequestMic: () => void;
  /** Compact inline mode (for pre-session) vs full blocking mode */
  compact?: boolean;
}

/**
 * Preflight mic permission check UI.
 * Shows current mic status and a retry button if blocked.
 */
export function MicPreflight({ status, onRequestMic, compact }: MicPreflightProps) {
  const statusConfig = {
    "not-requested": {
      icon: Mic,
      label: "Mic: not requested",
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      border: "border-border",
    },
    checking: {
      icon: Loader2,
      label: "Requesting mic access…",
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/30",
    },
    allowed: {
      icon: CheckCircle2,
      label: "Mic: allowed",
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/30",
    },
    blocked: {
      icon: MicOff,
      label: "Mic: blocked",
      color: "text-destructive",
      bg: "bg-destructive/5",
      border: "border-destructive/30",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-[10px] font-medium ${config.color}`}>
        <Icon className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`} />
        <span>{config.label}</span>
        {status === "blocked" && (
          <button
            onClick={onRequestMic}
            className="underline underline-offset-2 hover:text-destructive/80 transition-colors"
          >
            retry
          </button>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className={`rounded-lg border ${config.border} ${config.bg} p-3 space-y-2`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color} ${status === "checking" ? "animate-spin" : ""}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>

        {status === "not-requested" && (
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Microphone access will be requested when you start the session.
          </p>
        )}

        {status === "blocked" && (
          <div className="space-y-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Microphone was denied. Check your browser's address bar for the mic icon, or go to site settings to allow access, then retry.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={onRequestMic}
            >
              <Mic className="h-3 w-3" />
              Enable Microphone
            </Button>
          </div>
        )}

        {status === "allowed" && (
          <p className="text-[10px] text-primary/80 leading-relaxed">
            ✓ Ready. Microphone access granted.
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to manage mic permission state.
 * Requests getUserMedia only on explicit user gesture (requestMic call).
 */
export function useMicPermission() {
  const [status, setStatus] = useState<MicStatus>("not-requested");

  // Check existing permission on mount (Permissions API)
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        if (result.state === "granted") setStatus("allowed");
        else if (result.state === "denied") setStatus("blocked");
        // "prompt" → keep as "not-requested"

        result.addEventListener("change", () => {
          if (result.state === "granted") setStatus("allowed");
          else if (result.state === "denied") setStatus("blocked");
          else setStatus("not-requested");
        });
      }).catch(() => {
        // Permissions API not supported for mic — leave as not-requested
      });
    }
  }, []);

  const requestMic = useCallback(async (): Promise<boolean> => {
    setStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // release immediately
      setStatus("allowed");
      return true;
    } catch {
      setStatus("blocked");
      return false;
    }
  }, []);

  return { status, requestMic };
}
