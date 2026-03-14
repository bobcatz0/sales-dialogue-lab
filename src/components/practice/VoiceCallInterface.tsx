import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VoiceCallInterfaceProps {
  /** Whether the call session is active */
  isActive: boolean;
  /** Whether the user is currently recording */
  isRecording: boolean;
  /** Whether the AI is speaking */
  isAISpeaking: boolean;
  /** Whether AI is processing/thinking */
  isProcessing: boolean;
  /** Whether audio is muted */
  isMuted: boolean;
  /** AI voice volume 0-1 */
  volume: number;
  /** Timer display string e.g. "02:34" */
  timerDisplay: string;
  /** Current role/persona title */
  roleTitle: string;
  /** Scenario badge label */
  scenarioLabel: string;
  /** Live transcription text while recording */
  liveTranscript?: string;
  /** Last AI message for display */
  lastAIMessage?: string;
  /** Waveform levels for visualization (array of 0-1 values) */
  waveformLevels?: number[];
  /** Question progress e.g. "3/~8" */
  questionProgress?: string;
  /** Callbacks */
  onStartRecording: () => void;
  onStopRecording: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onVolumeChange: (v: number) => void;
  /** Whether the call can be scored */
  canScore?: boolean;
  /** Whether "Coming Soon" overlay should show */
  comingSoon?: boolean;
}

export function VoiceCallInterface({
  isActive,
  isRecording,
  isAISpeaking,
  isProcessing,
  isMuted,
  volume,
  timerDisplay,
  roleTitle,
  scenarioLabel,
  liveTranscript,
  lastAIMessage,
  waveformLevels = [],
  questionProgress,
  onStartRecording,
  onStopRecording,
  onEndCall,
  onToggleMute,
  onVolumeChange,
  canScore,
  comingSoon,
}: VoiceCallInterfaceProps) {
  // Pulse animation for the mic ring
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      const avg =
        waveformLevels.length > 0
          ? waveformLevels.reduce((a, b) => a + b, 0) / waveformLevels.length
          : 0.1;
      setPulseScale(1 + avg * 0.4);
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording, waveformLevels]);

  return (
    <div className="relative flex flex-col items-center justify-between min-h-[420px] sm:min-h-[500px] py-6 px-4">
      {/* Coming Soon overlay */}
      {comingSoon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl">
          <Badge
            variant="secondary"
            className="text-sm px-4 py-1.5 mb-3 font-semibold"
          >
            Coming Soon
          </Badge>
          <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed">
            Voice Interview Mode is under development. Stay in Text Mode for
            now.
          </p>
        </div>
      )}

      {/* Top: Call status bar */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Live
              </span>
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[10px] border-border text-muted-foreground"
          >
            {scenarioLabel}
          </Badge>
        </div>
        <span className="text-sm font-mono tabular-nums text-foreground font-semibold">
          {timerDisplay}
        </span>
      </div>

      {/* Center: Persona + mic */}
      <div className="flex flex-col items-center gap-4 flex-1 justify-center">
        {/* Persona info */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {isAISpeaking
              ? "Interviewer is speaking…"
              : isRecording
                ? "Listening…"
                : isProcessing
                  ? "Processing…"
                  : "Ready"}
          </p>
          <h3 className="font-heading text-lg font-bold text-foreground">
            {roleTitle}
          </h3>
          {questionProgress && (
            <p className="text-[10px] text-muted-foreground font-mono">
              Question {questionProgress}
            </p>
          )}
        </div>

        {/* AI speaking indicator */}
        <AnimatePresence>
          {isAISpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            >
              <Radio className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[11px] font-medium text-primary">
                Speaking
              </span>
              {/* Mini bars */}
              <div className="flex items-end gap-px h-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-primary rounded-full"
                    animate={{ height: [4, 12, 6, 10, 4] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Large mic button with waveform ring */}
        <div className="relative">
          {/* Pulse ring */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: pulseScale, opacity: [0.6, 0.2] }}
              transition={{ duration: 0.3 }}
              style={{ margin: "-12px" }}
            />
          )}

          {/* Waveform ring */}
          {isRecording && waveformLevels.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                className="absolute"
              >
                {waveformLevels.map((level, i) => {
                  const angle = (i / waveformLevels.length) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const innerR = 52;
                  const outerR = innerR + level * 16;
                  const x1 = 70 + innerR * Math.cos(rad);
                  const y1 = 70 + innerR * Math.sin(rad);
                  const x2 = 70 + outerR * Math.cos(rad);
                  const y2 = 70 + outerR * Math.sin(rad);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity={0.5 + level * 0.5}
                    />
                  );
                })}
              </svg>
            </div>
          )}

          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isAISpeaking || isProcessing || comingSoon}
            className={`relative z-10 h-24 w-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isRecording
                ? "bg-destructive text-destructive-foreground shadow-destructive/30 scale-105"
                : "bg-primary text-primary-foreground shadow-primary/30 hover:scale-105 hover:shadow-xl"
            } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          {isRecording
            ? "Tap to stop"
            : isAISpeaking
              ? "Wait for interviewer to finish"
              : "Tap to speak"}
        </p>

        {/* Live transcription preview */}
        <AnimatePresence>
          {(liveTranscript || isRecording) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="w-full max-w-sm mx-auto"
            >
              <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3 min-h-[48px]">
                {liveTranscript ? (
                  <p className="text-xs text-foreground leading-relaxed">
                    {liveTranscript}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/50 italic">
                    Start speaking…
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last AI message preview */}
        <AnimatePresence>
          {lastAIMessage && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm mx-auto"
            >
              <div className="rounded-lg bg-card border border-border/40 px-4 py-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">
                  Interviewer
                </p>
                <p className="text-xs text-foreground leading-relaxed line-clamp-3">
                  {lastAIMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: Call controls */}
      <div className="w-full flex items-center justify-center gap-4 mt-4">
        {/* Mute toggle */}
        <button
          onClick={onToggleMute}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
            isMuted
              ? "bg-muted text-muted-foreground"
              : "bg-muted/50 text-foreground hover:bg-muted"
          }`}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>

        {/* Volume slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-20 h-1 accent-primary"
          aria-label="Volume"
        />

        {/* End call */}
        <Button
          variant={canScore ? "hero" : "destructive"}
          size="sm"
          className="gap-2 rounded-full px-5"
          onClick={onEndCall}
        >
          {canScore ? (
            <>Get Score</>
          ) : (
            <>
              <PhoneOff className="h-3.5 w-3.5" />
              End Call
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
