import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Keyboard,
  Radio,
  Target,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceRecorder } from "./VoiceRecorder";
import { MicPreflight, useMicPermission } from "./MicPreflight";

type TurnState = "ready" | "recording" | "transcribing" | "generating";

interface VoiceInterviewScreenProps {
  /** Scenario / environment title */
  scenarioTitle: string;
  /** Active role / persona title */
  roleTitle: string;
  /** Current question progress e.g. "3/~8" */
  questionProgress: string;
  /** Timer display string e.g. "02:34" */
  timerDisplay: string;
  /** Whether the session is active */
  sessionActive: boolean;
  /** Whether the AI is currently speaking (TTS playing) */
  isAISpeaking: boolean;
  /** Whether the AI is generating a response */
  isLoading: boolean;
  /** Last AI message text */
  lastAIMessage?: string;
  /** Live transcript while recording */
  liveTranscript?: string;
  /** Whether the user has enough messages for scoring */
  isReadyForScore: boolean;
  /** Whether mic is muted */
  isMuted: boolean;
  /** AI voice volume 0-1 */
  volume: number;
  /** Callbacks */
  onTranscript: (text: string, duration: number, pauseData?: { pauseLengthAvg: number; pauseLengthVariance: number }) => void;
  onEndSession: () => void;
  onRetryQuestion: () => void;
  onSwitchToText: () => void;
  onToggleMute: () => void;
  onVolumeChange: (v: number) => void;
}

/** Waveform bars animation for AI speaking state */
function SpeakingWaveform() {
  return (
    <div className="flex items-end gap-[3px] h-12 justify-center">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={{
            height: [6, 24 + Math.random() * 24, 8, 18 + Math.random() * 16, 6],
          }}
          transition={{
            duration: 1.2 + Math.random() * 0.6,
            repeat: Infinity,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Idle waveform — subtle breathing bars */
function IdleWaveform() {
  return (
    <div className="flex items-end gap-[3px] h-12 justify-center opacity-30">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-muted-foreground"
          animate={{ height: [4, 8, 4] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function VoiceInterviewScreen({
  scenarioTitle,
  roleTitle,
  questionProgress,
  timerDisplay,
  sessionActive,
  isAISpeaking,
  isLoading,
  lastAIMessage,
  liveTranscript,
  isReadyForScore,
  isMuted,
  volume,
  onTranscript,
  onEndSession,
  onRetryQuestion,
  onSwitchToText,
  onToggleMute,
  onVolumeChange,
}: VoiceInterviewScreenProps) {
  const mic = useMicPermission();

  // Derive turn state
  const turnState: TurnState = isAISpeaking
    ? "generating" // AI is speaking = "generating response" from user's POV is done, but we show generating while loading
    : isLoading
      ? "generating"
      : "ready";

  const stateLabel: Record<TurnState, string> = {
    ready: "Tap to Speak",
    recording: "Recording…",
    transcribing: "Transcribing…",
    generating: isAISpeaking ? "Interviewer Speaking…" : "Generating Response…",
  };

  const stateColor: Record<TurnState, string> = {
    ready: "text-primary",
    recording: "text-destructive",
    transcribing: "text-muted-foreground",
    generating: "text-primary",
  };

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* ──── TOP BAR ──── */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className="text-[10px] font-semibold shrink-0 gap-1">
              <Mic className="h-2.5 w-2.5" />
              Voice Interview
            </Badge>
            <span className="text-xs text-muted-foreground truncate">{scenarioTitle}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground">
              Q{questionProgress}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-mono tabular-nums font-semibold text-foreground">
                {timerDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──── MAIN CENTER ──── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
        {/* Persona */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Interviewer
          </p>
          <h3 className="font-heading text-lg font-bold text-foreground">{roleTitle}</h3>
        </div>

        {/* Waveform area */}
        <div className="w-full max-w-xs">
          <AnimatePresence mode="wait">
            {isAISpeaking ? (
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <SpeakingWaveform />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <IdleWaveform />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI prompt text */}
        <AnimatePresence>
          {lastAIMessage && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-md"
            >
              <div className="rounded-xl bg-card border border-border/50 px-5 py-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
                  <Radio className="h-2.5 w-2.5" />
                  Interviewer
                </p>
                <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                  {lastAIMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State label */}
        <div className="flex items-center gap-2">
          {(turnState === "generating") && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
          <p className={`text-xs font-medium ${stateColor[turnState]}`}>
            {stateLabel[turnState]}
          </p>
        </div>

        {/* Mic button + recorder */}
        <div className="w-full max-w-sm">
          <MicPreflight status={mic.status} onRequestMic={mic.requestMic} compact deviceDetected={mic.deviceDetected} permissionState={mic.permissionState} />
          <VoiceRecorder
            onTranscript={onTranscript}
            disabled={!sessionActive || isLoading || isAISpeaking}
            isAISpeaking={isAISpeaking}
          />
        </div>

        {/* Live transcript preview */}
        <AnimatePresence>
          {liveTranscript && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="w-full max-w-md"
            >
              <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3 min-h-[44px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">
                  Your Response
                </p>
                <p className="text-xs text-foreground leading-relaxed">
                  {liveTranscript}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ──── BOTTOM CONTROLS ──── */}
      <div className="border-t border-border px-4 py-3">
        {/* Volume controls */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={onToggleMute}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
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
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button
            variant={isReadyForScore ? "hero" : "destructive"}
            size="sm"
            className="gap-1.5 rounded-full px-5 text-xs"
            onClick={onEndSession}
          >
            {isReadyForScore ? (
              <>
                <Target className="h-3 w-3" />
                Get My Score
              </>
            ) : (
              <>
                <PhoneOff className="h-3 w-3" />
                End Session
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full px-4 text-xs text-muted-foreground"
            onClick={onRetryQuestion}
            disabled={isLoading || isAISpeaking}
          >
            <RotateCcw className="h-3 w-3" />
            Retry Question
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-full px-4 text-xs text-muted-foreground"
            onClick={onSwitchToText}
          >
            <Keyboard className="h-3 w-3" />
            Text Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
