import { supabase } from "@/integrations/supabase/client";

export type ActivityEventType = "rank_up" | "high_score" | "elo_gain" | "clan_join" | "personal_best";

interface PublishEventOpts {
  eventType: ActivityEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Publish an activity event to the live feed.
 * Silently fails — feed events are non-critical.
 */
export async function publishActivityEvent(opts: PublishEventOpts) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from("activity_events") as any).insert({
      user_id: user.id,
      event_type: opts.eventType,
      title: opts.title,
      description: opts.description ?? null,
      metadata: opts.metadata ?? {},
    });
  } catch {
    // Non-critical — silently ignore
  }
}
