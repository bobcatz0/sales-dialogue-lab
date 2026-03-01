import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PauseData {
  pauseLengthAvg: number;
  pauseLengthVariance: number;
}

interface VoiceRecorderProps {
  onTranscript: (text: string, durationSeconds: number, pauseData?: PauseData) => void;
  disabled?: boolean;
  isAISpeaking?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled, isAISpeaking }: VoiceRecorderProps) {
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

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const transcriptRef = useRef("");
  const confidenceRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseTimestampsRef = useRef<number[]>([]);
  const wasSpeakingRef = useRef(false);
  const lastSpeechEndRef = useRef<number>(0);
  const hadAnyAudioRef = useRef(false);
  const rmsHistoryRef = useRef<number[]>([]);
  const signalDurationRef = useRef<number>(0);
  const lastAboveSilenceRef = useRef<number>(0);

  const isSupported =
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

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

      // Debug-only audio capture to inspect blob size
      if (typeof MediaRecorder !== "undefined") {
        try {
          const recorder = new MediaRecorder(stream);
          audioChunksRef.current = [];
          recorder.ondataavailable = (evt) => {
            if (evt.data && evt.data.size > 0) {
              audioChunksRef.current.push(evt.data);
            }
          };
          recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
            console.log("[VoiceRecorder] audio blob length:", audioBlob.size);
          };
          recorder.start(1000);
          mediaRecorderRef.current = recorder;
        } catch (mediaErr) {
          console.warn("[VoiceRecorder] MediaRecorder debug capture unavailable:", mediaErr);
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
  }, []);

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
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    analyserRef.current = null;
    setWaveformLevels(Array(20).fill(0.1));
    setRmsDb(-Infinity);
  }, []);

  const isListeningRef = useRef(false);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input not supported in this browser. Using text mode.");
      return;
    }
    if (disabled || isAISpeaking) return;

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
    setHasReceivedAudio(false);
    setPeakDb(-Infinity);
    setDebugTranscript("");
    setDebugConfidence(null);
    setDebugSpeechDuration(0);

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Loosen speech detection for quieter iOS mic input
    const recognitionAny = recognition as any;
    recognitionAny.minSpeechConfidence = 0.05;
    recognitionAny.maxListeningTimeout = 10000; // >= 10s
    recognitionAny.silenceDuration = 1500; // 1.5s silence cutoff

    console.log("[VoiceRecorder] Recognition config:", {
      minSpeechConfidence: recognitionAny.minSpeechConfidence,
      maxListeningTimeout: recognitionAny.maxListeningTimeout,
      silenceDuration: recognitionAny.silenceDuration,
    });

    const MAX_LISTENING_TIMEOUT_MS = 10000;
    const SILENCE_CUTOFF_MS = 1500;

    const armMaxListeningTimeout = () => {
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = setTimeout(() => {
        if (!isListeningRef.current) return;
        console.log("[VoiceRecorder] max listening timeout reached (10s), cycling recognizer");
        try { recognition.stop(); } catch { /* ignore */ }
      }, MAX_LISTENING_TIMEOUT_MS);
    };

    const armSilenceCutoff = () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (!isListeningRef.current) return;
        console.log("[VoiceRecorder] silence cutoff reached (1.5s), cycling recognizer");
        try { recognition.stop(); } catch { /* ignore */ }
      }, SILENCE_CUTOFF_MS);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

      console.log(
        `[VoiceRecorder] Transcript returned: "${transcriptRef.current}" | confidence: ${
          latestConfidence !== null ? latestConfidence.toFixed(2) : "n/a"
        }`
      );

      armMaxListeningTimeout();
      armSilenceCutoff();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("[VoiceRecorder] SpeechRecognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Falling back to text mode.");
        isListeningRef.current = false;
        setIsRecording(false);
        stopWaveform();
        return;
      }
      // "no-speech" is normal on mobile — will auto-restart via onend
      if (event.error === "no-speech") {
        console.log("[VoiceRecorder] no-speech — will auto-restart via onend");
        return;
      }
      if (event.error !== "aborted") {
        toast.error("Recording failed. Try again.");
      }
    };

    recognition.onend = () => {
      console.log("[VoiceRecorder] onend fired — isListening:", isListeningRef.current);
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
        listeningTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      // Auto-restart only if user hasn't tapped Stop
      if (isListeningRef.current) {
        console.log("[VoiceRecorder] Auto-restarting recognition...");
        try {
          recognition.start();
          armMaxListeningTimeout();
          armSilenceCutoff();
        } catch (e) {
          console.warn("[VoiceRecorder] Restart failed (iOS gesture loss):", e);
          // On iOS, restart may fail outside gesture context.
          // Don't stop recording — user still has transcript from first session.
        }
      }
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    startTimeRef.current = Date.now();
    setIsRecording(true);

    // CRITICAL: start() must be called directly in user gesture context (iOS Safari)
    recognition.start();
    armMaxListeningTimeout();
    armSilenceCutoff();
    // Start waveform in same gesture context for iOS AudioContext
    startWaveform();
  }, [isSupported, disabled, isAISpeaking, startWaveform, stopWaveform]);

  const stopRecording = useCallback(() => {
    const duration = (Date.now() - startTimeRef.current) / 1000;
    // Signal onend to NOT auto-restart before stopping
    isListeningRef.current = false;
    startTimeRef.current = 0;
    setIsRecording(false);
    setDebugSpeechDuration(Math.round(duration * 10) / 10);

    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    stopWaveform();

    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try { rec.stop(); } catch { /* already stopped */ }
    }

    setIsTranscribing(true);
    // No minimum duration — accept even short bursts (>300ms)
    setTimeout(() => {
      setIsTranscribing(false);
      const transcript = transcriptRef.current.trim();
      const confidence = confidenceRef.current;

      // Debug summary
      const history = rmsHistoryRef.current;
      const avgRms = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : -Infinity;
      console.log(`[VoiceRecorder] STOP — duration: ${duration.toFixed(1)}s | avgRMS: ${avgRms.toFixed(1)} dB | signalMs: ${signalDurationRef.current.toFixed(0)} | hadAudio: ${hadAnyAudioRef.current} | transcript: "${transcript.slice(0, 50)}" | confidence: ${confidence !== null ? confidence.toFixed(2) : "n/a"}`);
      console.log(`[VoiceRecorder] transcript returned: "${transcript}" | confidence score: ${confidence !== null ? confidence.toFixed(2) : "n/a"}`);

      if (transcript && transcript.length > 3) {
        const pauses = pauseTimestampsRef.current;
        let pauseData: PauseData | undefined;
        if (pauses.length > 0) {
          const avg = pauses.reduce((s, p) => s + p, 0) / pauses.length;
          const variance = Math.sqrt(
            pauses.reduce((s, p) => s + (p - avg) ** 2, 0) / pauses.length
          );
          pauseData = {
            pauseLengthAvg: Math.round(avg * 100) / 100,
            pauseLengthVariance: Math.round(variance * 100) / 100,
          };
        }
        onTranscript(transcript, Math.round(duration), pauseData);
      } else {
        // STT returned nothing — rely on transcript, not VAD/RMS
        toast.error("No speech detected. Try again.");
      }
    }, 500);
  }, [onTranscript, stopWaveform]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isSupported) return null;

  // Map dB to a 0-100 meter level for display
  const meterLevel = Math.max(0, Math.min(100, ((rmsDb + 60) / 60) * 100));

  return (
    <div className="flex flex-col items-center gap-3 py-4">
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
                  disabled={disabled}
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 rounded-full p-0 border-2 border-primary/40 hover:border-primary hover:bg-primary/5"
                >
                  <Mic className="h-6 w-6 text-primary" />
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Tap to record your answer
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
