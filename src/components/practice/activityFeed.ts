/**
 * Activity feed — records real player events and provides a seeded pool
 * of fake events so the feed feels active even with few users.
 */

export type ActivityEventType = "score" | "personal_best" | "rank_up" | "elo" | "promo";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  text: string;
  timestamp: number; // ms since epoch
  isReal?: boolean;
}

const FEED_KEY = "salescalls_activity_events";
const MAX_STORED = 30;

export function loadActivityEvents(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(FEED_KEY);
    if (raw) return JSON.parse(raw) as ActivityEvent[];
  } catch { /* ignore */ }
  return [];
}

export function pushActivityEvent(event: Omit<ActivityEvent, "id" | "timestamp">): ActivityEvent {
  const events = loadActivityEvents();
  const newEvent: ActivityEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const updated = [newEvent, ...events].slice(0, MAX_STORED);
  localStorage.setItem(FEED_KEY, JSON.stringify(updated));
  return newEvent;
}

// ---------------------------------------------------------------------------
// Seeded fake events pool
// ---------------------------------------------------------------------------

const NAMES = [
  "Alex S.", "Jordan M.", "Taylor K.", "Casey R.", "Morgan L.",
  "Riley P.", "Sam W.", "Jamie O.", "Drew H.", "Parker B.",
  "Quinn C.", "Avery T.", "Blake N.", "Cameron F.", "Reese D.",
  "Skyler J.", "Emery G.", "Charlie V.", "Dallas R.", "Finley A.",
];

const SCENARIOS = [
  "Cold Call", "B2B Prospect", "Objection Handling",
  "Gatekeeper", "Decision Maker", "Internal Champion",
  "Technical Eval", "Follow-Up", "Executive Pitch",
];

const RANKS = ["Starter", "Closer", "Operator", "Rainmaker"];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Seeded PRNG (mulberry32) so the pool is stable per page load but varies each day */
function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a stable pool of fake events for today. */
export function buildFakeEventPool(count = 40): ActivityEvent[] {
  const todaySeed = Math.floor(Date.now() / 86400000); // changes each day
  const rng = makePrng(todaySeed);

  // Spread fake events over the last 60 minutes
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const name = pick(NAMES, rng);
    const scenario = pick(SCENARIOS, rng);
    const score = 55 + Math.floor(rng() * 40); // 55–94
    const elo = 10 + Math.floor(rng() * 55);   // 10–64
    const rank = pick(RANKS, rng);
    const nextRank = RANKS[Math.min(RANKS.indexOf(rank) + 1, RANKS.length - 1)];
    const typeRoll = rng();

    let type: ActivityEventType;
    let text: string;

    if (typeRoll < 0.32) {
      type = "score";
      text = `${name} scored ${score} in ${scenario}`;
    } else if (typeRoll < 0.52) {
      type = "elo";
      text = `${name} gained +${elo} ELO · now ${rank}`;
    } else if (typeRoll < 0.66) {
      type = "personal_best";
      text = `${name} set a new personal best: ${score} in ${scenario}`;
    } else if (typeRoll < 0.82) {
      type = "rank_up";
      text = `${name} ranked up to ${rank}`;
    } else {
      type = "promo";
      text = `${name} entered Promotion Series: ${rank} → ${nextRank}`;
    }

    // Spread timestamps backwards: later items in the pool = older
    const ageMs = ((i + 1) / count) * 60 * 60 * 1000; // up to 60 min ago

    return {
      id: `fake-${todaySeed}-${i}`,
      type,
      text,
      timestamp: now - ageMs,
      isReal: false,
    };
  });
}
