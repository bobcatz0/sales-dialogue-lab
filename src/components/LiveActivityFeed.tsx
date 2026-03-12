import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Zap, Users, Star, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface FeedEvent {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  display_name?: string;
  avatar_url?: string | null;
}

const EVENT_ICONS: Record<string, typeof Trophy> = {
  rank_up: Trophy,
  high_score: Star,
  elo_gain: TrendingUp,
  clan_join: Users,
  personal_best: Zap,
};

const EVENT_COLORS: Record<string, string> = {
  rank_up: "text-yellow-400",
  high_score: "text-primary",
  elo_gain: "text-emerald-400",
  clan_join: "text-blue-400",
  personal_best: "text-purple-400",
};

export function LiveActivityFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial events
  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await (supabase
        .from("activity_events") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        // Fetch display names
        const userIds = [...new Set(data.map((e: any) => e.user_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.id, { name: p.display_name, avatar: p.avatar_url }]) ?? []
        );

        const enriched: FeedEvent[] = data.map((e) => ({
          ...e,
          metadata: (e.metadata as Record<string, unknown>) ?? {},
          display_name: profileMap.get(e.user_id)?.name ?? "Anonymous",
          avatar_url: profileMap.get(e.user_id)?.avatar ?? null,
        }));

        setEvents(enriched);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  // Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "activity_events" },
        async (payload) => {
          const newEvent = payload.new as FeedEvent;

          // Fetch the display name
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", newEvent.user_id)
            .single();

          const enriched: FeedEvent = {
            ...newEvent,
            metadata: (newEvent.metadata as Record<string, unknown>) ?? {},
            display_name: profile?.display_name ?? "Anonymous",
            avatar_url: profile?.avatar_url ?? null,
          };

          setEvents((prev) => [enriched, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="card-elevated overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Live Activity</h3>
        <span className="ml-auto flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      </div>

      {/* Feed */}
      <ScrollArea className="h-[340px]">
        <div ref={scrollRef} className="divide-y divide-border/50">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground animate-pulse">Loading activity...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Zap className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No activity yet. Start practicing!</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {events.map((event, i) => {
                const Icon = EVENT_ICONS[event.event_type] ?? Zap;
                const color = EVENT_COLORS[event.event_type] ?? "text-muted-foreground";

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i < 5 ? i * 0.03 : 0 }}
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`mt-0.5 shrink-0 ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground leading-snug">
                        <span className="font-semibold">{event.display_name}</span>
                        {" "}
                        <span className="text-muted-foreground">{event.title}</span>
                      </p>
                      {event.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 shrink-0 mt-0.5 tabular-nums">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: false })}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
