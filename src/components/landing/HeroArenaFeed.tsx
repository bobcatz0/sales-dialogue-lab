import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Zap, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface FeedEvent {
  id: string;
  event_type: string;
  title: string;
  created_at: string;
  display_name?: string;
}

const ICONS: Record<string, typeof Trophy> = {
  rank_up: Trophy,
  high_score: Star,
  elo_gain: TrendingUp,
  clan_join: Users,
  personal_best: Zap,
};

const COLORS: Record<string, string> = {
  rank_up: "text-yellow-400",
  high_score: "text-primary",
  elo_gain: "text-emerald-400",
  clan_join: "text-blue-400",
  personal_best: "text-purple-400",
};

const GLOW: Record<string, string> = {
  rank_up: "shadow-yellow-400/20",
  high_score: "shadow-primary/20",
  elo_gain: "shadow-emerald-400/20",
  clan_join: "shadow-blue-400/20",
  personal_best: "shadow-purple-400/20",
};

export default function HeroArenaFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("activity_events") as any)
        .select("id, event_type, title, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(12);

      if (data?.length) {
        const userIds = [...new Set(data.map((e: any) => e.user_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

        setEvents(
          data.map((e: any) => ({
            id: e.id,
            event_type: e.event_type,
            title: e.title,
            created_at: e.created_at,
            display_name: nameMap.get(e.user_id) ?? "Anonymous",
          }))
        );
      }
      setLoaded(true);
    })();
  }, []);

  // Subscribe to new events
  useEffect(() => {
    const channel = supabase
      .channel("hero-arena-feed")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "activity_events" },
        async (payload: any) => {
          const e = payload.new;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", e.user_id)
            .single();

          setEvents((prev) =>
            [
              {
                id: e.id,
                event_type: e.event_type,
                title: e.title,
                created_at: e.created_at,
                display_name: profile?.display_name ?? "Anonymous",
              },
              ...prev,
            ].slice(0, 12)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!loaded) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Live Arena</span>
        <span className="text-[9px] text-muted-foreground ml-auto tabular-nums">
          {events.length} recent
        </span>
      </div>

      {/* Events */}
      <div className="divide-y divide-border/30 max-h-[240px] overflow-hidden">
        <AnimatePresence initial={true}>
          {events.slice(0, 8).map((event, i) => {
            const Icon = ICONS[event.event_type] ?? Zap;
            const color = COLORS[event.event_type] ?? "text-muted-foreground";
            const glow = GLOW[event.event_type] ?? "";

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted/20 transition-colors"
              >
                <div className={`shrink-0 ${color} ${glow} shadow-sm`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground leading-snug truncate">
                    <span className="font-semibold">{event.display_name}</span>{" "}
                    <span className="text-muted-foreground">{event.title}</span>
                  </p>
                </div>
                <span className="text-[9px] text-muted-foreground/50 shrink-0 tabular-nums">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: false })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Fade out at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
    </div>
  );
}
