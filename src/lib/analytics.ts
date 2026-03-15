/**
 * Launch analytics — tracks the core challenge loop for the first 100 users.
 *
 * Events:
 *   challenge_started       — user clicked "Begin Session" on the daily challenge
 *   challenge_completed     — session ended with the challenge condition met
 *   challenge_retried       — user clicked "Try Again" after a challenge session
 *   shared_result_clicked   — user copied their result to share it
 *   invite_link_opened      — page was opened via a ?ref= invite link
 *
 * All events are buffered locally (localStorage) and fire-and-forgot to the
 * Supabase launch-analytics edge function. Network failures are silent — the
 * local buffer acts as a fallback for manual review.
 */

const ANON_ID_KEY = "salescalls_anon_id";
const QUEUE_KEY = "salescalls_analytics_queue";
const INVITE_SEEN_KEY = "salescalls_invite_seen";
const MAX_BUFFER = 100;

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/launch-analytics`;
const ANON_HEADER = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export type AnalyticsEventName =
  | "challenge_started"
  | "challenge_completed"
  | "challenge_retried"
  | "shared_result_clicked"
  | "invite_link_opened";

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  userId: string;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
}

// ─── Anonymous identity ───────────────────────────────────────────────────────

export function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

// ─── Local buffer ─────────────────────────────────────────────────────────────

function bufferEvent(event: AnalyticsEvent): void {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    queue.push(event);
    // Keep only the last MAX_BUFFER events
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_BUFFER)));
  } catch { /* ignore */ }
}

/** Read buffered events (for debug/manual export). */
export function getBufferedEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Track ────────────────────────────────────────────────────────────────────

export function track(
  eventName: AnalyticsEventName,
  properties?: Record<string, string | number | boolean>,
): void {
  const event: AnalyticsEvent = {
    event: eventName,
    userId: getAnonId(),
    timestamp: new Date().toISOString(),
    properties,
  };

  // Always buffer locally first
  bufferEvent(event);

  // Fire-and-forget to edge function
  if (import.meta.env.VITE_SUPABASE_URL) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ANON_HEADER) headers["apikey"] = ANON_HEADER;

    fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(event),
    }).catch(() => {
      // Silently fail — event is already in local buffer
    });
  }
}

// ─── Invite link detection ────────────────────────────────────────────────────

/**
 * Call once on app init. Fires `invite_link_opened` if the URL contains a
 * `?ref=` param and we haven't already logged this visit.
 */
export function trackInviteIfPresent(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;

    // Only fire once per ref visit
    const seen = localStorage.getItem(INVITE_SEEN_KEY);
    if (seen === ref) return;

    localStorage.setItem(INVITE_SEEN_KEY, ref);
    track("invite_link_opened", { ref });
  } catch { /* ignore */ }
}
