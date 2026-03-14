import { useRef, useState, useCallback } from "react";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-tts`;

export function useProspectVoice() {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  // Use refs for values read inside async callbacks to avoid stale closures
  const isMutedRef = useRef(false);
  const volumeRef = useRef(1);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
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
        utterance.volume = volumeRef.current;
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
    []
  );

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (isMutedRef.current) return;

      // Stop any currently playing audio before starting new one
      cleanup();

      try {
        const response = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audio.volume = volumeRef.current;
        audioRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            // Revoke URL after playback
            if (objectUrlRef.current === url) {
              URL.revokeObjectURL(url);
              objectUrlRef.current = null;
            }
            audioRef.current = null;
            setIsPlaying(false);
            resolve();
          };
          audio.onerror = (e) => {
            console.error("[TTS] Audio playback error:", e);
            audioRef.current = null;
            setIsPlaying(false);
            resolve();
          };
          setIsPlaying(true);
          audio.play().catch((e) => {
            console.error("[TTS] audio.play() rejected:", e);
            setIsPlaying(false);
            resolve();
          });
        });
      } catch (e) {
        console.warn("[TTS] ElevenLabs failed, falling back to browser TTS:", e);
        await speakBrowserNative(text);
      }
    },
    [cleanup, speakBrowserNative]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) cleanup(); // stop current audio when muting
      return next;
    });
  }, [cleanup]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    volumeRef.current = v;
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return { isMuted, isPlaying, volume, speak, toggleMute, setVolume, cleanup };
}
