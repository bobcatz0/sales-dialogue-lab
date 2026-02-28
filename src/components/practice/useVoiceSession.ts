import { useState, useRef, useCallback } from "react";
import { useProspectVoice } from "./useProspectVoice";
import { analyzeVoiceMetrics, generateVoiceFeedback, type VoiceMetrics } from "./voiceInterviewDesign";

export interface VoiceSessionState {
  voiceMode: boolean;
  setVoiceMode: (v: boolean) => void;
  isAISpeaking: boolean;
  speakAIMessage: (text: string) => Promise<void>;
  recordVoiceMetrics: (transcript: string, durationSeconds: number) => void;
  getSessionVoiceMetrics: () => VoiceMetrics | null;
  getVoiceFeedbackLines: () => string[];
  getVoiceScoreAdjustment: () => number;
  cleanup: () => void;
}

export function useVoiceSession(): VoiceSessionState {
  const [voiceMode, setVoiceMode] = useState(false);
  const { isPlaying, speak, cleanup } = useProspectVoice();
  const metricsAccumulator = useRef<{ transcript: string; duration: number }[]>([]);

  const speakAIMessage = useCallback(
    async (text: string) => {
      if (!voiceMode) return;
      // Clean markers from text before speaking
      const clean = text
        .replace(/\[CALL_ENDED\]/g, "")
        .replace(/\[HARD_CLOSE_WIN\]/g, "")
        .replace(/\[.*?\]/g, "")
        .trim();
      if (clean) await speak(clean);
    },
    [voiceMode, speak]
  );

  const recordVoiceMetrics = useCallback(
    (transcript: string, durationSeconds: number) => {
      metricsAccumulator.current.push({ transcript, duration: durationSeconds });
    },
    []
  );

  const getSessionVoiceMetrics = useCallback((): VoiceMetrics | null => {
    const entries = metricsAccumulator.current;
    if (entries.length === 0) return null;

    const fullTranscript = entries.map((e) => e.transcript).join(" ");
    const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);

    return analyzeVoiceMetrics(fullTranscript, totalDuration);
  }, []);

  const getVoiceFeedbackLines = useCallback((): string[] => {
    const metrics = getSessionVoiceMetrics();
    if (!metrics) return [];
    return generateVoiceFeedback(metrics);
  }, [getSessionVoiceMetrics]);

  const getVoiceScoreAdjustment = useCallback((): number => {
    const metrics = getSessionVoiceMetrics();
    if (!metrics) return 0;

    let adjustment = 0;

    // Filler penalty
    if (metrics.fillerFrequency > 5) adjustment -= 5;
    else if (metrics.fillerFrequency > 2) adjustment -= 2;
    else if (metrics.fillerFrequency <= 1) adjustment += 3;

    // Pace bonus/penalty
    if (metrics.verbalPace >= 140 && metrics.verbalPace <= 170) adjustment += 3;
    else if (metrics.verbalPace > 190 || metrics.verbalPace < 120) adjustment -= 3;

    // Duration appropriateness — per response average
    const entries = metricsAccumulator.current;
    const avgDuration = entries.reduce((s, e) => s + e.duration, 0) / entries.length;
    if (avgDuration >= 25 && avgDuration <= 50) adjustment += 2;
    else if (avgDuration > 90) adjustment -= 3;

    // Clamp to -5..+10
    return Math.max(-5, Math.min(10, adjustment));
  }, [getSessionVoiceMetrics]);

  const handleSetVoiceMode = useCallback(
    (v: boolean) => {
      setVoiceMode(v);
      if (!v) {
        cleanup();
        metricsAccumulator.current = [];
      }
    },
    [cleanup]
  );

  return {
    voiceMode,
    setVoiceMode: handleSetVoiceMode,
    isAISpeaking: isPlaying,
    speakAIMessage,
    recordVoiceMetrics,
    getSessionVoiceMetrics,
    getVoiceFeedbackLines,
    getVoiceScoreAdjustment,
    cleanup,
  };
}
