import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const STT_FALLBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-stt`;
const UNSUPPORTED_STT_MESSAGE = "Voice transcription not supported in this browser. Open in Chrome / Safari, or switch to Text Mode.";
const HEALTH_CHECK_TIMEOUT_MS = 5000;
const SWITCHING_TO_BACKUP_MSG = "Switching to backup transcription…";

interface PauseData {
  pauseLengthAvg: number;
  pauseLengthVariance: number;
}

interface VoiceRecorderProps {
  onTranscript: (text: string, durationSeconds: number, pauseData?: PauseData) => void;
  disabled?: boolean;
  isAISpeaking?: boolean;
  onTextModeFallbackToggle?: (enabled: boolean) => void;
  textModeFallbackEnabled?: boolean;
}

export function VoiceRecorder({
  onTranscript,
  disabled,
  isAISpeaking,
  onTextModeFallbackToggle,
  textModeFallbackEnabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(Array(20).fill(0.1));
  const [rmsDb, setRmsDb] = useState<number>(-Infinity);
  const [peakDb, setPeakDb] = useState<number>(-Infinity);
  const [hasReceivedAudio, setHasReceivedAudio] = useState(false);
  const [debugTranscript, setDebugTranscript] = useState("");
  const [debugConfidence, setDebugConfidence] = useState<number | null>(null);
  const [debugSpeechDuration, setDebugSpeechDuration] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [speechEvents, setSpeechEvents] = useState<{ type: string; detail: string; time: string }[]>([]);
  const [sttBanner, setSttBanner] = useState<string | null>(null);
  const [sttFallbackState, setSttFallbackState] = useState<"idle" | "switching" | "failed">("idle");
  const networkErrorTriggeredRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const transcriptRef = useRef("");
  const confidenceRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const healthCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpeechStartOrResultRef = useRef(false);
  const hadAnyRecognitionResultRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const sessionFailedRef = useRef(false);
  const backendOnlyModeRef = useRef(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobRef = useRef<Blob | null>(null);
  const pauseTimestampsRef = useRef<number[]>([]);
  const wasSpeakingRef = useRef(false);
  const lastSpeechEndRef = useRef<number>(0);
  const hadAnyAudioRef = useRef(false);
  const rmsHistoryRef = useRef<number[]>([]);
  const signalDurationRef = useRef<number>(0);
  const lastAboveSilenceRef = useRef<number>(0);

  const isSpeechRecognitionSupported =
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
  const isMediaRecorderSupported = typeof window !== "undefined" && typeof MediaRecorder !== "undefined";

  const logEvent = useCallback((type: string, detail: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 1 } as any);
    setSpeechEvents((prev) => [{ type, detail, time }, ...prev].slice(0, 30));
  }, []);

  // Timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(seconds);
        setDebugSpeechDuration(seconds);
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const clearHealthCheck = useCallback(() => {
    if (healthCheckTimeoutRef.current) {
      clearTimeout(healthCheckTimeoutRef.current);
      healthCheckTimeoutRef.current = null;
    }
  }, []);

  const showUnsupportedBanner = useCallback(() => {
    setSttBanner(UNSUPPORTED_STT_MESSAGE);
    toast.error(UNSUPPORTED_STT_MESSAGE);
  }, []);

  const transcribeWithBackendFallback = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      try {
        logEvent("backend-stt", `uploading ${Math.round(audioBlob.size / 1024)} KB`);
        const formData = new FormData();
        formData.append("audio", audioBlob, `voice.${audioBlob.type.includes("mp4") ? "m4a" : "webm"}`);

        const response = await fetch(STT_FALLBACK_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const backendError = typeof payload?.error === "string" ? payload.error : "Backend STT failed";
          logEvent("backend-stt-error", backendError);
          console.error("[VoiceRecorder] backend STT error:", backendError);
          return null;
        }

        const transcript = typeof payload?.transcript === "string" ? payload.transcript.trim() : "";
        if (transcript.length > 2) {
          logEvent("backend-stt", `transcript ok (${transcript.length} chars)`);
          console.log("[VoiceRecorder] backend transcript:", transcript);
          return transcript;
        }

        logEvent("backend-stt", "no transcript returned");
        return null;
      } catch (error) {
        logEvent("backend-stt-error", "request failed");
        console.error("[VoiceRecorder] backend STT request failed:", error);
        return null;
      }
    },
    [logEvent]
  );

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      setSttBanner(UNSUPPORTED_STT_MESSAGE);
    }
  }, [isSpeechRecognitionSupported]);

  useEffect(() => {
    return () => {
      clearHealthCheck();
    };
  }, [clearHealthCheck]);

  // Waveform + RMS meter via analyser — called inside click handler for iOS
  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Debug: log device info
      const track = stream.getTracks()[0];
      if (track) {
        console.log("[VoiceRecorder] Audio track label:", track.label);
        console.log("[VoiceRecorder] Audio track settings:", JSON.stringify(track.getSettings()));
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === "audioinput");
        console.log("[VoiceRecorder] Audio input devices:", audioInputs.map(d => d.label || d.deviceId));
      } catch { /* ignore */ }

      // Capture microphone audio so we can optionally use backend Whisper fallback
      if (typeof MediaRecorder !== "undefined") {
        try {
          const recorder = new MediaRecorder(stream);
          audioChunksRef.current = [];
          recordedAudioBlobRef.current = null;
          recorder.ondataavailable = (evt) => {
            if (evt.data && evt.data.size > 0) {
              audioChunksRef.current.push(evt.data);
            }
          };
          recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
            recordedAudioBlobRef.current = audioBlob;
            logEvent("media-stop", `${Math.round(audioBlob.size / 1024)} KB captured`);
            console.log("[VoiceRecorder] audio blob length:", audioBlob.size);
          };
          recorder.start(1000);
          mediaRecorderRef.current = recorder;
        } catch (mediaErr) {
          console.warn("[VoiceRecorder] MediaRecorder capture unavailable:", mediaErr);
          logEvent("media-error", "MediaRecorder unavailable");
        }
      }

      // Create AudioContext inside user gesture handler (critical for iOS)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      // iOS requires explicit resume inside user gesture
      await ctx.resume();
      console.log("[VoiceRecorder] AudioContext state after resume:", ctx.state);
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // higher resolution for RMS
      source.connect(analyser);
      // Connect to destination to keep audio graph active on iOS
      // Use a gain node at 0 to avoid feedback
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      analyser.connect(silentGain);
      silentGain.connect(ctx.destination);

      analyserRef.current = analyser;

      const timeDomainData = new Uint8Array(analyser.frequencyBinCount);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      // Lower speech threshold for quieter iOS mic input
      const SPEECH_THRESHOLD_DB = -72;
      const SILENCE_FLOOR_DB = -82;
      const SILENCE_CUTOFF_MS = 1500;
      let frameCount = 0;

      const update = () => {
        // Time-domain RMS calculation
        analyser.getByteTimeDomainData(timeDomainData);
        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const normalized = (timeDomainData[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / timeDomainData.length);
        const db = 20 * Math.log10(rms || 1e-9);

        setRmsDb(Math.round(db * 10) / 10);
        setPeakDb(prev => Math.max(prev, Math.round(db * 10) / 10));

        // Track RMS history for debug summary
        rmsHistoryRef.current.push(db);

        // Any signal above silence floor counts as audio received
        if (db > SILENCE_FLOOR_DB) {
          hadAnyAudioRef.current = true;
          setHasReceivedAudio(true);
        }

        // Track sustained signal duration (>150ms = speech)
        const now = Date.now();
        if (db > SPEECH_THRESHOLD_DB) {
          if (lastAboveSilenceRef.current === 0) lastAboveSilenceRef.current = now;
          signalDurationRef.current += (now - (lastAboveSilenceRef.current || now));
          lastAboveSilenceRef.current = now;
        } else {
          // Reset sustained tracker after 200ms gap
          if (lastAboveSilenceRef.current > 0 && now - lastAboveSilenceRef.current > SILENCE_CUTOFF_MS) {
            lastAboveSilenceRef.current = 0;
          }
        }

        // Debug logging every ~60 frames (~1s at 60fps)
        frameCount++;
        if (frameCount % 60 === 0) {
          const history = rmsHistoryRef.current;
          const avgRms = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : -Infinity;
          console.log(`[VoiceRecorder] RMS: ${db.toFixed(1)} dB | avg: ${avgRms.toFixed(1)} dB | threshold: ${SPEECH_THRESHOLD_DB} dB | signalMs: ${signalDurationRef.current.toFixed(0)} | hadAudio: ${hadAnyAudioRef.current}`);
        }

        // Frequency data for waveform visualization
        analyser.getByteFrequencyData(freqData);
        const levels = Array.from({ length: 20 }, (_, i) => {
          const idx = Math.floor((i / 20) * freqData.length);
          return Math.max(0.08, freqData[idx] / 255);
        });
        setWaveformLevels(levels);

        // Pause detection using lowered threshold
        const isSpeaking = db > SPEECH_THRESHOLD_DB;
        const nowPause = Date.now();
        if (wasSpeakingRef.current && !isSpeaking) {
          lastSpeechEndRef.current = nowPause;
        } else if (!wasSpeakingRef.current && isSpeaking && lastSpeechEndRef.current > 0) {
          const pauseMs = nowPause - lastSpeechEndRef.current;
          if (pauseMs > 200) {
            pauseTimestampsRef.current.push(pauseMs / 1000);
          }
        }
        wasSpeakingRef.current = isSpeaking;

        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error("[VoiceRecorder] Waveform/analyser setup failed:", err);
    }
  }, [logEvent]);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      if (recorder.state !== "inactive") {
        try { recorder.stop(); } catch { /* ignore */ }
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setWaveformLevels(Array(20).fill(0.1));
    setRmsDb(-Infinity);
  }, []);

  const isListeningRef = useRef(false);

  const buildPauseData = useCallback((): PauseData | undefined => {
    const pauses = pauseTimestampsRef.current;
    if (pauses.length === 0) return undefined;

    const avg = pauses.reduce((s, p) => s + p, 0) / pauses.length;
    const variance = Math.sqrt(
      pauses.reduce((s, p) => s + (p - avg) ** 2, 0) / pauses.length
    );

    return {
      pauseLengthAvg: Math.round(avg * 100) / 100,
      pauseLengthVariance: Math.round(variance * 100) / 100,
    };
  }, []);

  const finalizeTranscript = useCallback(
    async (duration: number) => {
      setIsTranscribing(true);
      await new Promise((resolve) => setTimeout(resolve, 650));

      let transcript = transcriptRef.current.trim();
      const confidence = confidenceRef.current;

      const history = rmsHistoryRef.current;
      const avgRms = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : -Infinity;
      console.log(
        `[VoiceRecorder] STOP — duration: ${duration.toFixed(1)}s | avgRMS: ${avgRms.toFixed(1)} dB | signalMs: ${signalDurationRef.current.toFixed(0)} | hadAudio: ${hadAnyAudioRef.current} | transcript: "${transcript.slice(0, 50)}" | confidence: ${confidence !== null ? confidence.toFixed(2) : "n/a"}`
      );

      // If native STT returned nothing useful, try backend Whisper fallback
      if ((backendOnlyModeRef.current || transcript.length <= 2) && recordedAudioBlobRef.current?.size) {
        setSttFallbackState("switching");
        setSttBanner(SWITCHING_TO_BACKUP_MSG);
        logEvent("fallback", networkErrorTriggeredRef.current ? "onerror:network → backend" : "empty transcript → backend");

        const backendTranscript = await transcribeWithBackendFallback(recordedAudioBlobRef.current);
        if (backendTranscript && backendTranscript.length > 2) {
          transcript = backendTranscript;
          setDebugTranscript(backendTranscript);
          setDebugConfidence(null);
          setSttFallbackState("idle");
          setSttBanner(null);
        } else {
          setSttFallbackState("failed");
          setSttBanner("Backup transcription returned no result.");
        }
      }

      setIsTranscribing(false);
      networkErrorTriggeredRef.current = false;

      if (transcript.length > 2) {
        setSttBanner(null);
        setSttFallbackState("idle");
        onTranscript(transcript, Math.round(duration), buildPauseData());
        return true;
      }

      sessionFailedRef.current = true;
      setSttFallbackState("failed");
      setSttBanner(UNSUPPORTED_STT_MESSAGE);
      return false;
    },
    [
      buildPauseData,
      onTranscript,
      logEvent,
      transcribeWithBackendFallback,
    ]
  );

  const startRecording = useCallback(() => {
    if (disabled || isAISpeaking) return;

    clearHealthCheck();
    stopRequestedRef.current = false;
    sessionFailedRef.current = false;
    hasSpeechStartOrResultRef.current = false;
    hadAnyRecognitionResultRef.current = false;
    backendOnlyModeRef.current = !isSpeechRecognitionSupported;
    networkErrorTriggeredRef.current = false;
    setSttFallbackState("idle");

    // Reset state
    pauseTimestampsRef.current = [];
    wasSpeakingRef.current = false;
    lastSpeechEndRef.current = 0;
    hadAnyAudioRef.current = false;
    rmsHistoryRef.current = [];
    signalDurationRef.current = 0;
    lastAboveSilenceRef.current = 0;
    transcriptRef.current = "";
    confidenceRef.current = null;
    recordedAudioBlobRef.current = null;
    setHasReceivedAudio(false);
    setPeakDb(-Infinity);
    setDebugTranscript("");
    setDebugConfidence(null);
    setDebugSpeechDuration(0);
    setSttBanner(isSpeechRecognitionSupported ? null : UNSUPPORTED_STT_MESSAGE);

    if (!isSpeechRecognitionSupported) {
      if (!isMediaRecorderSupported) {
        showUnsupportedBanner();
        return;
      }

      logEvent("backend-stt", "SpeechRecognition unavailable, recording for backend fallback");
      startTimeRef.current = Date.now();
      isListeningRef.current = true;
      setIsRecording(true);
      void startWaveform();
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    const recognitionAny = recognition as any;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionAny.maxAlternatives = 3;
    recognition.lang = "en-US";

    console.log("[VoiceRecorder] Recognition config:", {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      maxAlternatives: recognitionAny.maxAlternatives,
      lang: recognition.lang,
    });

    recognitionAny.onspeechstart = () => {
      hasSpeechStartOrResultRef.current = true;
      clearHealthCheck();
      logEvent("onspeechstart", "speech started");
      console.log("[VoiceRecorder] onspeechstart event fired");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      hasSpeechStartOrResultRef.current = true;
      hadAnyRecognitionResultRef.current = true;
      clearHealthCheck();

      logEvent("onresult", `${event.results.length} result(s)`);
      console.log("[VoiceRecorder] onresult fired:", event);

      let finalTranscript = "";
      let interimTranscript = "";
      let latestConfidence: number | null = null;

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptChunk = result[0]?.transcript ?? "";
        const confidence = typeof result[0]?.confidence === "number" ? result[0].confidence : null;
        if (confidence !== null) latestConfidence = confidence;

        console.log(
          `[VoiceRecorder] Raw transcript (${result.isFinal ? "final" : "interim"}): "${transcriptChunk}" | confidence: ${
            confidence !== null ? confidence.toFixed(2) : "n/a"
          }`
        );

        if (result.isFinal) {
          finalTranscript += transcriptChunk;
        } else {
          interimTranscript += transcriptChunk;
        }
      }

      transcriptRef.current = (finalTranscript + interimTranscript).trim();
      setDebugTranscript(transcriptRef.current);
      confidenceRef.current = latestConfidence;
      setDebugConfidence(latestConfidence);

      logEvent(
        "onresult",
        `"${transcriptRef.current.slice(0, 40)}" conf=${latestConfidence !== null ? latestConfidence.toFixed(2) : "n/a"}`
      );
      console.log(`[VoiceRecorder] transcript: "${transcriptRef.current}"`);
      console.log(`[VoiceRecorder] confidence: ${latestConfidence !== null ? latestConfidence.toFixed(2) : "n/a"}`);
    };

    recognitionAny.onspeechend = () => {
      logEvent("onspeechend", "speech ended");
      console.log("[VoiceRecorder] onspeechend event fired");
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logEvent("onerror", event.error);
      console.error("[VoiceRecorder] onerror event:", event.error, event);

      if (event.error === "not-allowed") {
        isListeningRef.current = false;
        setIsRecording(false);
        stopWaveform();
        showUnsupportedBanner();
        return;
      }

      // Network error = STT engine unavailable (common on Android Brave/Opera)
      // Switch to backend-only mode so finalizeTranscript uses Whisper
      if (event.error === "network") {
        networkErrorTriggeredRef.current = true;
        backendOnlyModeRef.current = true;
        logEvent("onerror", "network — will use backend Whisper fallback");
        return;
      }

      // Do not reject on silence/no-speech; keep flow user-controlled.
      if (event.error === "no-speech") {
        console.log("[VoiceRecorder] no-speech event received");
        return;
      }

      if (event.error !== "aborted") {
        toast.error("Recording failed. Try again.");
      }
    };

    recognition.onend = () => {
      clearHealthCheck();
      logEvent("onend", "recognition session ended");
      console.log("[VoiceRecorder] onend fired");

      if (stopRequestedRef.current || sessionFailedRef.current) return;

      isListeningRef.current = false;
      setIsRecording(false);
      recognitionRef.current = null;
      stopWaveform();

      const duration = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
      void finalizeTranscript(duration);
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    startTimeRef.current = Date.now();
    setIsRecording(true);

    healthCheckTimeoutRef.current = setTimeout(() => {
      if (hasSpeechStartOrResultRef.current || stopRequestedRef.current) return;

      logEvent("health-check", `No onspeechstart/onresult within ${HEALTH_CHECK_TIMEOUT_MS / 1000}s`);
      console.error("[VoiceRecorder] STT health check failed: no speech events");
      toast.error("Speech engine unavailable / blocked");
      setSttBanner(UNSUPPORTED_STT_MESSAGE);

      stopRequestedRef.current = true;
      isListeningRef.current = false;
      setIsRecording(false);
      const duration = Math.max(1, (Date.now() - startTimeRef.current) / 1000);

      const activeRecognition = recognitionRef.current;
      recognitionRef.current = null;
      if (activeRecognition) {
        try {
          activeRecognition.stop();
        } catch {
          // ignore stop race
        }
      }

      stopWaveform();
      void finalizeTranscript(duration);
    }, HEALTH_CHECK_TIMEOUT_MS);

    // CRITICAL: start() must be called directly in user gesture context
    recognition.start();
    void startWaveform();
  }, [
    isSpeechRecognitionSupported,
    isMediaRecorderSupported,
    disabled,
    isAISpeaking,
    clearHealthCheck,
    logEvent,
    showUnsupportedBanner,
    startWaveform,
    stopWaveform,
    finalizeTranscript,
  ]);

  const stopRecording = useCallback(async () => {
    const duration = (Date.now() - startTimeRef.current) / 1000;
    stopRequestedRef.current = true;
    isListeningRef.current = false;
    startTimeRef.current = 0;
    clearHealthCheck();

    setIsRecording(false);
    setDebugSpeechDuration(Math.round(duration * 10) / 10);

    stopWaveform();

    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
    }

    await finalizeTranscript(duration);
  }, [clearHealthCheck, finalizeTranscript, stopWaveform]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Map dB to a 0-100 meter level for display
  const meterLevel = Math.max(0, Math.min(100, ((rmsDb + 60) / 60) * 100));

  return (
    <div className="flex flex-col items-center gap-3 py-4 w-full">
      {sttBanner && (
        <div className="w-full max-w-[360px] rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
          <p className="text-[11px] leading-relaxed text-destructive">{sttBanner}</p>
          {sttFallbackState === "failed" && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                onClick={startRecording}
              >
                Retry
              </Button>
              {onTextModeFallbackToggle && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px]"
                  onClick={() => onTextModeFallbackToggle(true)}
                >
                  Use Text Instead
                </Button>
              )}
            </div>
          )}
          {sttFallbackState === "idle" && onTextModeFallbackToggle && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Text Mode fallback</span>
              <Switch
                checked={textModeFallbackEnabled}
                onCheckedChange={onTextModeFallbackToggle}
                aria-label="Enable Text Mode fallback"
              />
            </div>
          )}
        </div>
      )}
      <AnimatePresence mode="wait">
        {isTranscribing ? (
          <motion.div
            key="transcribing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Transcribing…</span>
          </motion.div>
        ) : isRecording ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            {/* Waveform */}
            <div className="flex items-center justify-center gap-[2px] h-10">
              {waveformLevels.map((level, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-primary"
                  animate={{ height: `${Math.max(4, level * 40)}px` }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>

            {/* Live RMS meter */}
            <div className="w-full max-w-[200px] space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    meterLevel > 30 ? "bg-primary" : meterLevel > 5 ? "bg-yellow-500" : "bg-destructive/50"
                  }`}
                  animate={{ width: `${meterLevel}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                <span>{rmsDb > -Infinity ? `${rmsDb} dB` : "—"}</span>
                <span className={hasReceivedAudio ? "text-primary" : "text-destructive"}>
                  {hasReceivedAudio ? "Audio ✓" : "No signal"}
                </span>
              </div>
            </div>

            {/* Visible speech debug panel */}
            <div className="w-full max-w-[300px] rounded-md border border-border bg-card/80 p-2 text-[10px]">
              <p className="font-semibold text-foreground">Debug panel</p>
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                <p>Detected transcript: {debugTranscript || "—"}</p>
                <p>Confidence score: {debugConfidence !== null ? debugConfidence.toFixed(2) : "n/a"}</p>
                <p>Speech duration: {debugSpeechDuration.toFixed(1)}s</p>
              </div>
              <button
                onClick={() => setShowDiagnostics(p => !p)}
                className="mt-1.5 text-[9px] text-primary underline"
              >
                {showDiagnostics ? "Hide" : "Show"} event log ({speechEvents.length})
              </button>
              {showDiagnostics && (
                <div className="mt-1 max-h-[100px] overflow-y-auto space-y-px border-t border-border pt-1">
                  {speechEvents.length === 0 && <p className="text-muted-foreground italic">No events yet</p>}
                  {speechEvents.map((e, i) => (
                    <p key={i} className="font-mono text-[9px] text-muted-foreground">
                      <span className="text-foreground/60">{e.time}</span>{" "}
                      <span className={
                        e.type === "onerror" ? "text-destructive" :
                        e.type === "onresult" ? "text-primary" : "text-muted-foreground"
                      }>{e.type}</span>{" "}
                      {e.detail}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-mono text-foreground tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>

            {/* Stop button */}
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="sm"
              className="h-10 px-6 gap-2"
            >
              <Square className="h-3.5 w-3.5" />
              Stop Recording
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            {isAISpeaking ? (
              <p className="text-xs text-muted-foreground">
                Interviewer is speaking…
              </p>
            ) : (
              <>
                <Button
                  onClick={startRecording}
                  disabled={disabled || (!isSpeechRecognitionSupported && !isMediaRecorderSupported)}
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 rounded-full p-0 border-2 border-primary/40 hover:border-primary hover:bg-primary/5"
                >
                  <Mic className="h-6 w-6 text-primary" />
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  {isSpeechRecognitionSupported
                    ? "Tap to record your answer"
                    : isMediaRecorderSupported
                      ? "SpeechRecognition unavailable — using backend STT"
                      : "Switch to Text Mode to continue"}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
