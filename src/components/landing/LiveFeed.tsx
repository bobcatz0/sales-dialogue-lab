import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Zap, Star, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  icon: string;
  name: string;
  text: string;
  time: string;
}

const ICON_MAP: Record<string, typeof Trophy> = {
  rank_up: Trophy,
  high_score: Star,
  elo_gain: TrendingUp,
  personal_best: Zap,
  promotion: Shield,
};

const COLOR_MAP: Record<string, string> = {
  rank_up: "text-yellow-400",
  high_score: "text-primary",
  elo_gain: "text-emerald-400",
  personal_best: "text-purple-400",
  promotion: "text-amber-400",
};

const FALLBACK: FeedItem[] = [
  { id: "f1", icon: "high_score", name: "Alex", text: "scored 91 on Cold Call Objection", time: "2m" },
  { id: "f2", icon: "rank_up", name: "Sarah", text: "ranked up to Operator", time: "4m" },
  { id: "f3", icon: "elo_gain", name: "Jawan", text: "gained +38 ELO", time: "6m" },
  { id: "f4", icon: "personal_best", name: "Michelle", text: "new personal best: 94", time: "9m" },
  { id: "f5", icon: "promotion", name: "Ravi", text: "entered promotion series", time: "11m" },
  { id: "f6", icon: "high_score", name: "Taylor", text: "scored 87 on Discovery Call", time: "14m" },
  { id: "f7", icon: "elo_gain", name: "Jordan", text: "gained +25 ELO", time: "18m" },
  { id: "f8", icon: "rank_up", name: "Casey", text: "ranked up to Closer", time: "22m" },
];

export default function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("activity_events")
          .select("id, event_type, title, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(10);

        if (data && data.length >= 3) {
          const userIds = [...new Set(data.map((e) => e.user_id))] as string[];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds);

          const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

          const real: FeedItem[] = data.map((e) => ({
            id: e.id,
            icon: e.event_type,
            name: nameMap.get(e.user_id) ?? "Anonymous",
            text: e.title,
            time: formatDistanceToNow(new Date(e.created_at), { addSuffix: false }),
          }));
          setItems(real);
        }
      } catch {
        // Use fallback
      }
      setLoaded(true);
    })();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("homepage-live-feed")
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

          const newItem: FeedItem = {
            id: e.id,
            icon: e.event_type,
            name: profile?.display_name ?? "Anonymous",
            text: e.title,
            time: "just now",
          };
          setItems((prev) => [newItem, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section className="py-6 border-y border-border/40 bg-card/30">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[11px] font-bold text-foreground uppercase tracking-widest font-[var(--font-heading)]">
            Live Activity
          </span>
        </div>

        {/* Feed list */}
        <div className="space-y-0.5 max-h-[220px] overflow-hidden relative">
          <AnimatePresence initial={true}>
            {items.slice(0, 8).map((item, i) => {
              const Icon = ICON_MAP[item.icon] ?? Zap;
              const color = COLOR_MAP[item.icon] ?? "text-muted-foreground";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors"
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                  <p className="text-xs text-foreground leading-snug truncate flex-1">
                    <span className="font-semibold">{item.name}</span>{" "}
                    <span className="text-muted-foreground">{item.text}</span>
                  </p>
                  <span className="text-[9px] text-muted-foreground/50 shrink-0 tabular-nums">
                    {item.time}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {/* Fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
