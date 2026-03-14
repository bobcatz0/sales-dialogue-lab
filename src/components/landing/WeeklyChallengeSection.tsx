import { motion } from "framer-motion";
import { Trophy, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTodayChallenge } from "@/components/practice/dailyChallenge";
import { UserAvatar } from "@/components/UserAvatar";
import { getEloRank } from "@/lib/elo";

interface ChallengePlayer {
  display_name: string;
  avatar_url: string | null;
  score: number;
  elo: number;
}

const MOCK_PLAYERS: ChallengePlayer[] = [
  { display_name: "Alex", avatar_url: null, score: 91, elo: 1580 },
  { display_name: "Maria", avatar_url: null, score: 88, elo: 1420 },
  { display_name: "Ravi", avatar_url: null, score: 84, elo: 1310 },
];

const SCENARIO_LABELS: Record<string, string> = {
  "cold-call": "Cold Call Scenario",
  "interview": "Interview Pressure Round",
  "enterprise": "Enterprise Deal Simulation",
};

export default function WeeklyChallengeSection() {
  const [players, setPlayers] = useState<ChallengePlayer[]>(MOCK_PLAYERS);
  const challenge = getTodayChallenge().challenge;
  const scenarioLabel = SCENARIO_LABELS[challenge.environmentId] ?? challenge.environmentId;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("scorecards")
        .select("score, display_name, avatar_url, elo")
        .order("score", { ascending: false })
        .limit(5);
      if (data && data.length >= 3) {
        setPlayers(data.map(d => ({
          display_name: d.display_name,
          avatar_url: d.avatar_url,
          score: d.score,
          elo: d.elo ?? 1000,
        })));
      }
    })();
  }, []);

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-elevated overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-primary/[0.03]">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Weekly Challenge
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              Resets every Monday
            </span>
          </div>

          {/* Challenge info */}
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-[10px] font-mono text-primary/60 uppercase tracking-wider mb-1">
              {challenge.skillFocus}
            </p>
            <h3 className="font-heading text-lg font-bold text-foreground">
              {scenarioLabel}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {challenge.successLabel}
            </p>
          </div>

          {/* Mini leaderboard */}
          <div className="divide-y divide-border/20">
            {players.slice(0, 5).map((player, i) => (
              <motion.div
                key={player.display_name + i}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-5 py-2.5"
              >
                <span className={`w-5 text-center text-xs font-bold tabular-nums ${
                  i === 0 ? "text-yellow-500" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <UserAvatar
                  avatarUrl={player.avatar_url}
                  displayName={player.display_name}
                  elo={player.elo}
                  size="xs"
                  showRankBadge={false}
                  showName={false}
                />
                <span className="text-[11px] font-semibold text-foreground flex-1 truncate">
                  {player.display_name}
                </span>
                <span className="text-sm font-bold font-heading text-foreground tabular-nums">
                  {player.score}
                </span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-5 py-3 border-t border-border/30">
            <Button variant="hero" size="sm" className="w-full gap-2" asChild>
              <Link to="/practice">
                Take the Challenge
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
