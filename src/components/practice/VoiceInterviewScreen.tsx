/**
 * VoiceInterviewScreen — dedicated full-pane UI for turn-based voice sessions.
 *
 * Replaces the chat bubble view while voice mode is active. Owns no session
 * logic; all state flows in from Practice.tsx via props.
 *
 * States rendered:
 *   idle       — VoiceRecorder shown (handles its own recording/transcribing)
 *   generating — spinner in AI card while LLM streams
 *   speaking   — wave animation while ElevenLabs audio plays
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2, VolumeX, RotateCcw, StopCircle,
  MessageSquare, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "./VoiceRecorder";
import { MicPreflight } from "./MicPreflight";
import type { MicStatus } from "./MicPreflight";
import type { ChatMessage } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PauseData {
  pauseLengthAvg: number;
  pauseLengthVariance: number;
}

interface MicState {
  status: MicStatus;
  requestMic: () => void;
  deviceDetected: boolean;
  permissionState: string;
}

export interface VoiceInterviewScreenProps {
  roleTitle: string;
  envTitle?: string;
  messages: ChatMessage[];
  isLoading: boolean;
  isAISpeaking: boolean;
  isMuted: boolean;
  volume: number;
  mic: MicState;
  timer: string;
  onTranscript: (text: string, duration: number, pauseData?: PauseData) => void;
  onEndSession: () => void;
  onReset: () => void;
  onSwitchToText: () => void;
  onToggleMute: () => void;
  onSetVolume: (v: number) => void;
  isColdCall?: boolean;
  onTextModeFallbackToggle?: (enabled: boolean) => void;
  textModeFallbackEnabled?: boolean;
  /** True while feedback is loading — disables End Session */
  isFeedbackLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Small animation helpers
// ---------------------------------------------------------------------------

function SpeakingWave() {
  return (
    <div className="flex items-end gap-[3px] h-4" aria-hidden>
      {[0.5, 0.8, 1, 0.8, 0.5].map((scale, i) => (
        <motion.span
          key={i}
          className="inline-block w-[3px] rounded-full bg-primary"
          animate={{ height: [`${4 * scale}px`, `${14 * scale}px`, `${4 * scale}px`] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip internal markers from AI text before displaying */
function cleanAIText(text: string): string {
  return text
    .replace(/\[CALL_ENDED\]/g, "")
    .replace(/\[HARD_CLOSE_WIN\]/g, "")
    .replace(/\[.*?\]/g, "")
    .trim();
}

function avatarInitials(title: string): string {
  return title
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VoiceInterviewScreen({
  roleTitle,
  envTitle,
  messages,
  isLoading,
  isAISpeaking,
  isMuted,
  volume,
  mic,
  timer,
  onTranscript,
  onEndSession,
  onReset,
  onSwitchToText,
  onToggleMute,
  onSetVolume,
  isColdCall = false,
  onTextModeFallbackToggle,
  textModeFallbackEnabled = false,
  isFeedbackLoading = false,
}: VoiceInterviewScreenProps) {
  // Derive display data from messages
  const prospectMsgs = messages.filter((m) => m.role === "prospect");
  const userMsgs     = messages.filter((m) => m.role === "user");

  const lastAI   = prospectMsgs[prospectMsgs.length - 1];
  const lastUser = userMsgs[userMsgs.length - 1];

  const turnCount       = userMsgs.length;
  const canEnd          = turnCount >= 2 && !isFeedbackLoading;
  const aiText          = lastAI ? cleanAIText(lastAI.text) : "";
  const initials        = avatarInitials(roleTitle);

  // Show VoiceRecorder only when not waiting on AI
  const showRecorder = !isLoading && !isAISpeaking;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border shrink-0">
        {/* Left: env + role labels */}
        <div className="flex items-center gap-2 min-w-0">
          {envTitle && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
              {envTitle}
            </span>
          )}
          {envTitle && <span className="text-border shrink-0">·</span>}
          <span className="text-xs font-semibold text-foreground truncate">{roleTitle}</span>
        </div>

        {/* Right: turn counter + timer + volume */}
        <div className="flex items-center gap-3 shrink-0">
          {turnCount > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              Turn {turnCount}
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
            {timer}
          </span>
          <button
            onClick={onToggleMute}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isMuted ? "Unmute AI voice" : "Mute AI voice"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <input
            type="range"
            min="0" max="1" step="0.1"
            value={volume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            className="w-14 h-1 accent-primary cursor-pointer"
            aria-label="AI voice volume"
          />
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-4 py-4 min-h-0">

        {/* AI message card */}
        <motion.div
          layout
          className={`rounded-xl border p-4 transition-colors duration-300 ${
            isAISpeaking
              ? "border-primary/40 bg-primary/5"
              : isLoading
                ? "border-border bg-muted/20"
                : "border-border bg-muted/10"
          }`}
        >
          {/* Avatar row */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors duration-300 ${
                isAISpeaking ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {initials}
            </div>
            <span className="text-xs font-semibold text-foreground flex-1 truncate">{roleTitle}</span>

            {/* State pill */}
            <AnimatePresence mode="wait">
              {isAISpeaking && (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2 py-0.5"
                >
                  <SpeakingWave />
                  <span className="text-[10px] text-primary font-medium">Speaking</span>
                </motion.div>
              )}
              {isLoading && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 bg-muted rounded-full px-2 py-0.5"
                >
                  <ThinkingDots />
                  <span className="text-[10px] text-muted-foreground font-medium">Thinking</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI message text */}
          <AnimatePresence mode="wait">
            {aiText ? (
              <motion.p
                key={aiText.slice(0, 40)}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm leading-relaxed text-foreground"
              >
                {aiText}
              </motion.p>
            ) : isLoading ? (
              <motion.div
                key="loading-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 py-1"
              >
                <ThinkingDots />
                <span className="text-xs text-muted-foreground">Generating response…</span>
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">
                {isColdCall ? "Line is live. Begin when ready." : "Ready — tap the mic to respond."}
              </p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* User transcript card — appears after first user turn */}
        <AnimatePresence>
          {lastUser && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  You said
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{lastUser.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Interaction area ──────────────────────────────────── */}
      <div className="shrink-0 border-t border-border">
        <div className="px-4 pt-3 pb-1">
          <MicPreflight
            status={mic.status}
            onRequestMic={mic.requestMic}
            compact
            deviceDetected={mic.deviceDetected}
            permissionState={mic.permissionState}
          />

          <AnimatePresence mode="wait">
            {isAISpeaking ? (
              <motion.div
                key="ai-speaking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 py-5"
              >
                <SpeakingWave />
                <p className="text-xs text-muted-foreground">Prospect is speaking…</p>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                key="ai-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 py-5"
              >
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Generating response…</p>
              </motion.div>
            ) : (
              <motion.div
                key="recorder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VoiceRecorder
                  onTranscript={onTranscript}
                  isAISpeaking={false}
                  onTextModeFallbackToggle={onTextModeFallbackToggle}
                  textModeFallbackEnabled={textModeFallbackEnabled}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-center gap-2 px-4 pb-3 flex-wrap">
          {!isColdCall && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground gap-1"
              onClick={onReset}
              disabled={isLoading}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground gap-1"
            onClick={onSwitchToText}
          >
            <MessageSquare className="h-3 w-3" />
            Text Mode
          </Button>
          <Button
            variant={isColdCall ? "destructive" : "outline"}
            size="sm"
            className={`h-8 text-xs gap-1 ${isColdCall ? "px-4" : ""}`}
            onClick={onEndSession}
            disabled={!canEnd || isLoading}
            title={!canEnd ? "Complete at least 2 exchanges to end the session" : undefined}
          >
            <StopCircle className="h-3 w-3" />
            {isColdCall ? "End Call" : "End Session"}
          </Button>
        </div>
      </div>
    </div>
  );
}
