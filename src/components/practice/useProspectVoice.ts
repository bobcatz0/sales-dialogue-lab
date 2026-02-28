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
    setIsPlaying(false);
  }, []);

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
          console.error("TTS request failed:", resp.status);
          return; // silent fail – text is still visible
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
        console.error("TTS error:", e);
        // Don't toast – text response is still available
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
