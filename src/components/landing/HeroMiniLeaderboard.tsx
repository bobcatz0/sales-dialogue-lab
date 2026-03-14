import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TopEntry {
  name: string;
  score: number;
}

const FALLBACK: TopEntry[] = [
  { name: "Alex K.", score: 94 },
  { name: "Maria S.", score: 91 },
  { name: "Jordan R.", score: 88 },
];

export default function HeroMiniLeaderboard() {
  const [entries, setEntries] = useState<TopEntry[]>(FALLBACK);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("scorecards")
      .select("display_name, score")
      .gte("created_at", `${today}T00:00:00`)
      .order("score", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length >= 3) {
          setEntries(data.map((d) => ({ name: d.display_name, score: d.score })));
        }
      });
  }, []);

  const icons = [
    <Crown key="1" className="h-3.5 w-3.5 text-yellow-500" />,
    <Medal key="2" className="h-3.5 w-3.5 text-muted-foreground" />,
    <Medal key="3" className="h-3.5 w-3.5 text-amber-600" />,
  ];

  const rankStyles = [
    "text-primary font-bold",
    "text-foreground font-semibold",
    "text-foreground font-semibold",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mx-auto mt-8 max-w-xs"
    >
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Top Players Today
        </span>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm divide-y divide-border/30">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2"
          >
            <span className="w-5 shrink-0 flex justify-center">{icons[i]}</span>
            <span className={`text-xs flex-1 truncate ${rankStyles[i]}`}>
              {entry.name}
            </span>
            <span className={`text-xs font-bold font-heading tabular-nums ${
              i === 0 ? "text-primary" : "text-foreground"
            }`}>
              {entry.score}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
