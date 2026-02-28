import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscript: (text: string, durationSeconds: number) => void;
  disabled?: boolean;
  isAISpeaking?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled, isAISpeaking }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(Array(20).fill(0.1));
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const transcriptRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  // Timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  // Waveform via analyser
  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        const levels = Array.from({ length: 20 }, (_, i) => {
          const idx = Math.floor((i / 20) * dataArray.length);
          return Math.max(0.08, dataArray[idx] / 255);
        });
        setWaveformLevels(levels);
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch {
      // Waveform is cosmetic — fail silently
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setWaveformLevels(Array(20).fill(0.1));
  }, []);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input not supported in this browser. Using text mode.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    transcriptRef.current = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      transcriptRef.current = (finalTranscript + interimTranscript).trim();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Falling back to text mode.");
        setIsRecording(false);
        stopWaveform();
        return;
      }
      if (event.error !== "no-speech") {
        toast.error("Recording failed. Try again.");
      }
    };

    recognition.onend = () => {
      // Will be handled by stopRecording
    };

    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();
    setIsRecording(true);
    recognition.start();
    startWaveform();
  }, [isSupported, startWaveform, stopWaveform]);

  const stopRecording = useCallback(() => {
    const duration = (Date.now() - startTimeRef.current) / 1000;
    setIsRecording(false);
    stopWaveform();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Small delay to capture final results
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      const transcript = transcriptRef.current.trim();
      if (transcript) {
        onTranscript(transcript, Math.round(duration));
      } else {
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
