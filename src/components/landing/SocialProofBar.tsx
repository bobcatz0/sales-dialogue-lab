import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Zap, Trophy, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "./AnimatedStats";

function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [profilesRes, historyRes] = await Promise.all([
        supabase.from("profiles").select("elo, total_sessions", { count: "exact" }),
        supabase.from("elo_history").select("id", { count: "exact", head: true }),
      ]);

      const profiles = profilesRes.data ?? [];
      const playerCount = profilesRes.count ?? profiles.length;
      const totalSessions = profiles.reduce((sum, p) => sum + (p.total_sessions ?? 0), 0);
      const topElo = profiles.length ? Math.max(...profiles.map((p) => p.elo ?? 1000)) : 1000;
      const totalRounds = historyRes.count ?? 0;

      return { playerCount, totalSessions, topElo, totalRounds };
    },
    staleTime: 60_000,
  });
}

const SocialProofBar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const { data } = usePlatformStats();

  // Use real data with sensible minimums so the bar never looks empty
  const stats = [
    {
      icon: Users,
      value: Math.max(data?.playerCount ?? 0, 12),
      label: "Active Players",
      suffix: "+",
    },
    {
      icon: Zap,
      value: Math.max(data?.totalSessions ?? 0, 48),
      label: "Sessions Completed",
      suffix: "+",
    },
    {
      icon: TrendingUp,
      value: Math.max(data?.totalRounds ?? 0, 120),
      label: "Rounds Played",
      suffix: "+",
    },
    {
      icon: Trophy,
      value: data?.topElo ?? 1200,
      label: "Highest ELO",
      suffix: "",
    },
  ];

  return (
    <section ref={ref} className="py-10 border-y border-border/40 bg-card/30">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold font-heading text-foreground">
                {isInView ? (
                  <AnimatedCounter target={stat.value} delay={0.2 + i * 0.1} duration={1.2} suffix={stat.suffix} />
                ) : (
                  "0"
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofBar;
