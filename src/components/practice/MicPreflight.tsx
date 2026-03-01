import { useState, useCallback, useEffect } from "react";
import { Mic, MicOff, AlertCircle, CheckCircle2, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export type MicStatus = "not-requested" | "checking" | "allowed" | "blocked" | "no-device";

interface MicPreflightProps {
  status: MicStatus;
  onRequestMic: () => void;
  compact?: boolean;
  debug?: boolean;
  deviceDetected?: boolean;
  permissionState?: string;
}

export function MicPreflight({ status, onRequestMic, compact, debug, deviceDetected, permissionState }: MicPreflightProps) {
  const statusConfig: Record<MicStatus, { icon: any; label: string; color: string; bg: string; border: string }> = {
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
    "no-device": {
      icon: HelpCircle,
      label: "No microphone detected",
      color: "text-destructive",
      bg: "bg-destructive/5",
      border: "border-destructive/30",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const debugInfo = debug ? (
    <div className="mt-1 text-[9px] font-mono text-muted-foreground/70 space-y-0.5">
      <div>Mic device detected: {deviceDetected ? "Yes" : "No"}</div>
      <div>Permission status: {permissionState || "unknown"}</div>
    </div>
  ) : null;

  if (compact) {
    return (
      <div>
        <div className={`flex items-center gap-1.5 text-[10px] font-medium ${config.color}`}>
          <Icon className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`} />
          <span>{config.label}</span>
          {(status === "blocked" || status === "no-device") && (
            <button
              onClick={onRequestMic}
              className="underline underline-offset-2 hover:text-destructive/80 transition-colors"
            >
              {status === "no-device" ? "re-check" : "retry"}
            </button>
          )}
        </div>
        {debugInfo}
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

        {status === "no-device" && (
          <div className="space-y-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                No microphone detected. Please connect a microphone and try again.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={onRequestMic}
            >
              <Mic className="h-3 w-3" />
              Re-check Devices
            </Button>
          </div>
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

        {debugInfo}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to manage mic permission state with device detection.
 */
export function useMicPermission() {
  const [status, setStatus] = useState<MicStatus>("not-requested");
  const [deviceDetected, setDeviceDetected] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<string>("unknown");

  // Check existing permission on mount (Permissions API)
  useEffect(() => {
    // Device detection
    checkDevices();

    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        setPermissionState(result.state);
        if (result.state === "granted") setStatus("allowed");
        else if (result.state === "denied") setStatus("blocked");

        result.addEventListener("change", () => {
          setPermissionState(result.state);
          if (result.state === "granted") setStatus("allowed");
          else if (result.state === "denied") setStatus("blocked");
          else setStatus("not-requested");
        });
      }).catch(() => {});
    }
  }, []);

  const checkDevices = useCallback(async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = devices.some((d) => d.kind === "audioinput");
      setDeviceDetected(hasAudio);
      if (!hasAudio) {
        setStatus("no-device");
      }
      return hasAudio;
    } catch {
      // enumerateDevices not supported — assume device exists
      setDeviceDetected(true);
      return true;
    }
  }, []);

  const requestMic = useCallback(async (): Promise<boolean> => {
    // First check for devices
    const hasDevice = await checkDevices();
    if (!hasDevice) {
      setStatus("no-device");
      return false;
    }

    setStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("allowed");
      setPermissionState("granted");
      return true;
    } catch (err: any) {
      // Distinguish between "in use" and "denied"
      if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
        setStatus("no-device");
        setPermissionState("no-device");
      } else if (err.name === "NotReadableError") {
        // Mic exists but is in use or hardware error
        setStatus("blocked");
        setPermissionState("in-use");
      } else {
        setStatus("blocked");
        setPermissionState("denied");
      }
      return false;
    }
  }, [checkDevices]);

  return { status, requestMic, deviceDetected, permissionState, checkDevices };
}
