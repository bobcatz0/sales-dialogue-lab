import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, Trophy, Crown, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface FlashChallenge {
  id: string;
  title: string;
  description: string | null;
  scenario_env: string;
  scenario_role: string;
  bonus_elo: number;
  starts_at: string;
  ends_at: string;
  status: string;
}

interface FlashScore {
  id: string;
  user_id: string;
  score: number;
  display_name: string;
  created_at: string;
}

function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        setExpired(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return { timeLeft, expired };
}

export default function FlashChallengeBanner() {
  const [challenge, setChallenge] = useState<FlashChallenge | null>(null);
  const [scores, setScores] = useState<FlashScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);

  const fetchChallenge = useCallback(async () => {
    const { data } = await supabase
      .from("flash_challenges")
      .select("*")
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const c = data[0] as FlashChallenge;
      setChallenge(c);

      // Fetch top scores
      const { data: scoreData } = await supabase
        .from("flash_challenge_scores")
        .select("*")
        .eq("challenge_id", c.id)
        .order("score", { ascending: false })
        .limit(5);

      if (scoreData) {
        setScores(scoreData as FlashScore[]);
        setParticipantCount(scoreData.length);
      }
    } else {
      setChallenge(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChallenge();

    // Subscribe to new scores
    const channel = supabase
      .channel("flash-scores")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flash_challenge_scores" },
        () => fetchChallenge()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchChallenge]);

  if (loading || !challenge) return null;

  return <FlashChallengeCard challenge={challenge} scores={scores} participantCount={participantCount} />;
}

function FlashChallengeCard({
  challenge,
  scores,
  participantCount,
}: {
  challenge: FlashChallenge;
  scores: FlashScore[];
  participantCount: number;
}) {
  const { timeLeft, expired } = useCountdown(challenge.ends_at);

  if (expired) return null;

  const podiumColors = ["text-yellow-400", "text-muted-foreground", "text-amber-600"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-card"
    >
      {/* Animated top bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500/60 via-yellow-400 to-amber-500/60" />

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5 pointer-events-none" />

      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center"
            >
              <Zap className="h-5 w-5 text-amber-400" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  ⚡ Flash Challenge
                </p>
                <Badge variant="outline" className="text-[9px] h-[16px] px-1.5 border-amber-500/30 text-amber-400 bg-amber-500/10">
                  +{challenge.bonus_elo} ELO
                </Badge>
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground mt-0.5">{challenge.title}</h3>
            </div>
          </div>

          {/* Timer */}
          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Ends in</p>
            <motion.p
              key={timeLeft}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              className="text-sm font-bold font-mono text-amber-400 tabular-nums"
            >
              {timeLeft}
            </motion.p>
          </div>
        </div>

        {/* Description */}
        {challenge.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
        )}

        {/* Mini Leaderboard */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Top Scores</p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {participantCount} player{participantCount !== 1 ? "s" : ""}
            </div>
          </div>

          {scores.length > 0 ? (
            <div className="space-y-1">
              {scores.slice(0, 5).map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50"
                >
                  <span className={`text-xs font-bold w-5 ${i < 3 ? podiumColors[i] : "text-muted-foreground"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="text-xs text-foreground flex-1 truncate">{s.display_name}</span>
                  <span className="text-xs font-bold font-heading text-foreground tabular-nums">{s.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/20 border border-border/30">
              <Trophy className="h-3.5 w-3.5 text-muted-foreground/40" />
              <p className="text-[11px] text-muted-foreground/60">No scores yet — be the first!</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <Button
          variant="default"
          size="sm"
          className="w-full h-9 text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black border-0"
          asChild
        >
          <a href={`/practice?env=${challenge.scenario_env}&role=${challenge.scenario_role}&flash=${challenge.id}`}>
            <Zap className="h-3.5 w-3.5" />
            Enter Flash Challenge
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
