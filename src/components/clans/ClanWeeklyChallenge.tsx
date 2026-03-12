import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Flame, Clock, Medal, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface LiveStanding {
  clan_id: string;
  clan_name: string;
  total_score: number;
  total_sessions: number;
}

interface PastResult {
  clan_id: string;
  clan_name: string;
  week_start: string;
  total_score: number;
  rank: number;
}

function getTimeUntilSunday() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday + (dayOfWeek === 0 ? 0 : 0));
  // Actually compute end of Sunday
  const endOfSunday = new Date(now);
  const daysLeft = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  endOfSunday.setUTCDate(now.getUTCDate() + daysLeft);
  endOfSunday.setUTCHours(23, 59, 59, 999);
  const diff = endOfSunday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h`;
}

export function ClanWeeklyChallenge() {
  const { user } = useAuth();
  const [standings, setStandings] = useState<LiveStanding[]>([]);
  const [pastWinners, setPastWinners] = useState<PastResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userClanId, setUserClanId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);

    // Get user's clan
    if (user) {
      const { data: membership } = await supabase
        .from("clan_members")
        .select("clan_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserClanId(membership?.clan_id ?? null);
    }

    // Compute current week standings from elo_history + clan_members
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - mondayOffset);
    thisMonday.setUTCHours(0, 0, 0, 0);

    // Get all clan members
    const { data: members } = await supabase
      .from("clan_members")
      .select("clan_id, user_id");

    if (members && members.length > 0) {
      const userIds = members.map((m) => m.user_id);

      const { data: history } = await supabase
        .from("elo_history")
        .select("user_id, session_score")
        .in("user_id", userIds)
        .gte("created_at", thisMonday.toISOString());

      // Build aggregation
      const userClanMap = new Map(members.map((m) => [m.user_id, m.clan_id]));
      const clanScores = new Map<string, { totalScore: number; sessions: number }>();

      for (const h of history ?? []) {
        const clanId = userClanMap.get(h.user_id);
        if (!clanId) continue;
        const existing = clanScores.get(clanId) ?? { totalScore: 0, sessions: 0 };
        existing.totalScore += h.session_score;
        existing.sessions += 1;
        clanScores.set(clanId, existing);
      }

      // Get clan names
      if (clanScores.size > 0) {
        const clanIds = [...clanScores.keys()];
        const { data: clans } = await supabase
          .from("clans")
          .select("id, name")
          .in("id", clanIds);

        const nameMap = new Map((clans ?? []).map((c) => [c.id, c.name]));

        const sorted = [...clanScores.entries()]
          .map(([clanId, s]) => ({
            clan_id: clanId,
            clan_name: nameMap.get(clanId) ?? "Unknown",
            total_score: s.totalScore,
            total_sessions: s.sessions,
          }))
          .sort((a, b) => b.total_score - a.total_score);

        setStandings(sorted);
      }
    }

    // Past winners (top 1 per week)
    const { data: past } = await supabase
      .from("clan_weekly_results")
      .select("clan_id, clan_name, week_start, total_score, rank")
      .eq("rank", 1)
      .order("week_start", { ascending: false })
      .limit(4);

    setPastWinners(past ?? []);
    setLoading(false);
  }

  if (loading) {
    return null;
  }

  const timeLeft = getTimeUntilSunday();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-sm font-bold text-foreground">Weekly Clan Challenge</h2>
        </div>
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1 border-primary/30 text-primary">
          <Clock className="h-2.5 w-2.5" />
          {timeLeft} left
        </Badge>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Clans compete for the highest combined session scores this week.
      </p>

      {/* Current standings */}
      {standings.length === 0 ? (
        <div className="text-center py-4">
          <Trophy className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No activity this week yet. Start practicing!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {standings.slice(0, 5).map((s, idx) => {
            const isUserClan = s.clan_id === userClanId;

            return (
              <motion.div
                key={s.clan_id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                  isUserClan
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center shrink-0">
                    {idx === 0 ? (
                      <Crown className="h-4 w-4 text-yellow-500 mx-auto" />
                    ) : idx === 1 ? (
                      <Medal className="h-3.5 w-3.5 text-gray-400 mx-auto" />
                    ) : idx === 2 ? (
                      <Medal className="h-3.5 w-3.5 text-amber-600 mx-auto" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{s.clan_name}</span>
                    {isUserClan && <span className="text-[9px] text-muted-foreground">(yours)</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{s.total_sessions} sessions</span>
                  <span className={`text-sm font-bold tabular-nums ${idx === 0 ? "text-primary" : "text-foreground"}`}>
                    {s.total_score.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Past winners */}
      {pastWinners.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Past Champions
          </p>
          <div className="flex flex-wrap gap-2">
            {pastWinners.map((w) => (
              <Badge key={w.week_start} variant="secondary" className="text-[10px] gap-1 px-2 py-1">
                <Trophy className="h-2.5 w-2.5 text-yellow-500" />
                {w.clan_name}
                <span className="text-muted-foreground">
                  · {new Date(w.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
