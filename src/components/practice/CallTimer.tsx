import { useState, useEffect, useRef, useCallback } from "react";
import { Clock } from "lucide-react";

interface CallTimerProps {
  running: boolean;
  onTick?: (seconds: number) => void;
}

export function CallTimer({ running, onTick }: CallTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          onTick?.(next);
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  if (!running && elapsed === 0) return null;

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums font-mono">
      <Clock className="h-3 w-3" />
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export function useCallTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const reset = useCallback(() => setElapsed(0), []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { elapsed, display, reset };
}
