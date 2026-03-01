import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-tts`;

export function useProspectVoice() {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const speakBrowserNative = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!window.speechSynthesis) {
          console.warn("[TTS] Browser speechSynthesis not available");
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = volume;
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          resolve();
        };
        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
      });
    },
    [volume]
  );

  const speak = useCallback(
    async (text: string) => {
      if (isMuted || !text.trim()) return;

      cleanup();

      try {
        const resp = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        });

        if (!resp.ok) {
          console.warn("[TTS] ElevenLabs failed:", resp.status, "— falling back to browser TTS");
          await speakBrowserNative(text);
          return;
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audio.volume = volume;
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          cleanup();
        };
        audio.onerror = () => {
          setIsPlaying(false);
          cleanup();
        };

        setIsPlaying(true);
        await audio.play();
      } catch (e) {
        console.warn("[TTS] ElevenLabs error, falling back to browser TTS:", e);
        await speakBrowserNative(text);
      }
    },
    [isMuted, cleanup, volume]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) cleanup(); // stop current audio when muting
      return next;
    });
  }, [cleanup]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return { isMuted, isPlaying, volume, speak, toggleMute, setVolume, cleanup };
}
