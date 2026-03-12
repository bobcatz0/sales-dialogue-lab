import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityItem {
  name: string;
  score: number;
  scenario: string;
}

const FALLBACK_ACTIVITIES: ActivityItem[] = [
  { name: "Alex", score: 85, scenario: "Cold Call Objection" },
  { name: "Sarah", score: 91, scenario: "SDR Interview" },
  { name: "Jawan", score: 78, scenario: "Discovery Call" },
  { name: "Michelle", score: 88, scenario: "Enterprise Negotiation" },
  { name: "Ravi", score: 72, scenario: "Interview Pressure Round" },
  { name: "Taylor", score: 94, scenario: "SDR Interview" },
  { name: "Jordan", score: 81, scenario: "Cold Call Objection" },
  { name: "Casey", score: 76, scenario: "Discovery Call" },
];

const SCENARIO_NAMES: Record<string, string> = {
  interview: "SDR Interview",
  "cold-call": "Cold Call Objection",
  enterprise: "Enterprise Negotiation",
  "final-round": "Final Round",
};

export default function ActivityTicker() {
  const [items, setItems] = useState<ActivityItem[]>(FALLBACK_ACTIVITIES);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Try to fetch real recent activity
  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("elo_history")
        .select("user_id, session_score, created_at")
        .order("created_at", { ascending: false })
        .limit(12);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((d) => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

        const real: ActivityItem[] = data.map((d) => ({
          name: nameMap.get(d.user_id) ?? "Anonymous",
          score: d.session_score,
          scenario: SCENARIO_NAMES[Object.keys(SCENARIO_NAMES)[Math.floor(Math.random() * 4)]] ?? "Practice Session",
        }));

        if (real.length >= 3) setItems(real);
      }
    };
    fetchRecent();
  }, []);

  // Rotate ticker
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [items.length]);

  const item = items[current];

  return (
    <div className="w-full overflow-hidden bg-card/50 border-b border-border/40 py-2">
      <div className="container mx-auto px-6 flex items-center justify-center gap-2 h-5">
        <Zap className="h-3 w-3 text-primary shrink-0" />
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-muted-foreground"
          >
            <span className="font-semibold text-foreground">{item.name}</span>
            {" just scored "}
            <span className="font-bold text-primary">{item.score}</span>
            {" on "}
            <span className="text-foreground">{item.scenario}</span>
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
