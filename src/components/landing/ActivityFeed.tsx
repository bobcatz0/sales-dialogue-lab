import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Award, Zap, Trophy, Target } from "lucide-react";
import { loadActivityEvents, buildFakeEventPool, type ActivityEvent, type ActivityEventType } from "@/components/practice/activityFeed";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const VISIBLE_COUNT = 5;
const ROTATE_MS = 3800;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function eventIcon(type: ActivityEventType) {
  switch (type) {
    case "score":        return TrendingUp;
    case "personal_best": return Trophy;
    case "rank_up":      return Award;
    case "elo":          return Zap;
    case "promo":        return Target;
  }
}

function eventAccent(type: ActivityEventType): string {
  switch (type) {
    case "score":        return "text-blue-400 bg-blue-400/10";
    case "personal_best": return "text-amber-400 bg-amber-400/10";
    case "rank_up":      return "text-primary bg-primary/10";
    case "elo":          return "text-green-400 bg-green-400/10";
    case "promo":        return "text-purple-400 bg-purple-400/10";
  }
}

function eventDot(type: ActivityEventType): string {
  switch (type) {
    case "score":        return "bg-blue-400";
    case "personal_best": return "bg-amber-400";
    case "rank_up":      return "bg-primary";
    case "elo":          return "bg-green-400";
    case "promo":        return "bg-purple-400";
  }
}

// ---------------------------------------------------------------------------
// Build the merged, time-sorted display pool
// ---------------------------------------------------------------------------
function buildDisplayPool(fakePool: ActivityEvent[]): ActivityEvent[] {
  const real = loadActivityEvents();
  const merged = [...real, ...fakePool];
  // Sort newest first, deduplicate by id
  const seen = new Set<string>();
  return merged
    .filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ActivityFeed() {
  const fakePoolRef = useRef<ActivityEvent[]>(buildFakeEventPool(40));
  const poolRef = useRef<ActivityEvent[]>(buildDisplayPool(fakePoolRef.current));
  const cursorRef = useRef(0);

  const [displayed, setDisplayed] = useState<ActivityEvent[]>(
    () => poolRef.current.slice(0, VISIBLE_COUNT)
  );

  // Keep a stable timestamp reference per render so timeAgo updates
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Rotate in a new event at top, drop the oldest displayed
    const rotate = setInterval(() => {
      cursorRef.current = (cursorRef.current + 1) % poolRef.current.length;
      const next = poolRef.current[cursorRef.current];
      setDisplayed((prev) => {
        // Avoid showing the same event twice in a row
        if (prev[0]?.id === next.id) return prev;
        return [next, ...prev.slice(0, VISIBLE_COUNT - 1)];
      });
      setTick((t) => t + 1); // trigger timeAgo re-calc
    }, ROTATE_MS);

    // Refresh real events periodically so actual sessions surface quickly
    const refresh = setInterval(() => {
      poolRef.current = buildDisplayPool(fakePoolRef.current);
    }, 10000);

    return () => {
      clearInterval(rotate);
      clearInterval(refresh);
    };
  }, []);

  return (
    <section className="py-10">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Live Activity
            </p>
          </div>

          {/* Feed */}
          <div
            className="rounded-xl border border-border bg-card/50 overflow-hidden divide-y divide-border/50"
            style={{ minHeight: `${VISIBLE_COUNT * 48}px` }}
          >
            <AnimatePresence initial={false}>
              {displayed.map((event) => {
                const Icon = eventIcon(event.type);
                const accent = eventAccent(event.type);
                const dot = eventDot(event.type);
                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      event.isReal ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    {/* Icon badge */}
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${accent}`}>
                      <Icon className="h-3 w-3" />
                    </div>

                    {/* Text */}
                    <p className="text-[12px] text-foreground/80 flex-1 leading-snug">
                      {event.isReal
                        ? <span className="font-semibold text-foreground">{event.text}</span>
                        : event.text}
                    </p>

                    {/* Real indicator dot */}
                    {event.isReal && (
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                    )}

                    {/* Time */}
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 tabular-nums">
                      {timeAgo(event.timestamp)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Footer label */}
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Activity from all players · Updates as you practice
          </p>
        </div>
      </div>
    </section>
  );
}
