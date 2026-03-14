import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Medal, Award, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SeasonResult {
  id: string;
  season_id: string;
  final_elo: number;
  final_rank: string;
  leaderboard_position: number;
  badge_awarded: string | null;
  total_sessions: number;
  seasons?: { name: string; starts_at: string; ends_at: string; status: string };
}

function getRankColor(rank: string) {
  switch (rank) {
    case "Sales Architect": return "text-purple-400";
    case "Rainmaker": return "text-yellow-400";
    case "Operator": return "text-blue-400";
    case "Closer": return "text-primary";
    case "Prospector": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

function getBadgeIcon(badge: string) {
  switch (badge) {
    case "Season Champion": return <Crown className="h-4 w-4 text-yellow-500" />;
    case "Season Runner-Up": return <Medal className="h-4 w-4 text-gray-400" />;
    case "Season Bronze": return <Medal className="h-4 w-4 text-amber-600" />;
    default: return <Award className="h-4 w-4 text-primary" />;
  }
}

function getBadgeBorder(badge: string) {
  switch (badge) {
    case "Season Champion": return "border-yellow-500/30 bg-yellow-500/5";
    case "Season Runner-Up": return "border-gray-400/30 bg-gray-400/5";
    case "Season Bronze": return "border-amber-600/30 bg-amber-600/5";
    default: return "border-primary/30 bg-primary/5";
  }
}

export function PastSeasonBadges({ userId }: { userId: string }) {
  const [results, setResults] = useState<SeasonResult[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("season_results")
        .select("*, seasons:season_id(name, starts_at, ends_at, status)")
        .eq("user_id", userId)
        .not("badge_awarded", "is", null)
        .order("created_at", { ascending: false }) as any;

      if (data) setResults(data);
    })();
  }, [userId]);

  if (results.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {results.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${getBadgeBorder(r.badge_awarded!)}`}
          title={`${r.badge_awarded} — ${(r as any).seasons?.name ?? "Past Season"} · #${r.leaderboard_position} · ${r.final_elo} ELO`}
        >
          {getBadgeIcon(r.badge_awarded!)}
          <span className={getRankColor(r.final_rank)}>{r.badge_awarded}</span>
        </motion.div>
      ))}
    </div>
  );
}

interface Season {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
}

export function SeasonSelector({
  onSeasonChange,
  currentSeasonId,
}: {
  onSeasonChange: (seasonId: string | null) => void;
  currentSeasonId: string | null;
}) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("seasons")
        .select("*")
        .in("status", ["active", "completed"])
        .order("starts_at", { ascending: false }) as any;

      if (data && data.length > 0) {
        setSeasons(data);
        const active = data.find((s: Season) => s.status === "active");
        setActiveSeason(active || data[0]);
      }
    })();
  }, []);

  if (seasons.length === 0) return null;

  const now = new Date();
  const activeEnd = activeSeason ? new Date(activeSeason.ends_at) : null;
  const daysRemaining = activeEnd ? Math.max(0, Math.ceil((activeEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Active season banner */}
      {activeSeason && activeSeason.status === "active" && (
        <div className="card-elevated p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{activeSeason.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(activeSeason.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" — "}
                {new Date(activeSeason.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          {daysRemaining !== null && (
            <div className="text-right">
              <p className="text-lg font-bold font-heading text-primary tabular-nums">{daysRemaining}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">days left</p>
            </div>
          )}
        </div>
      )}

      {/* Season tabs */}
      {seasons.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onSeasonChange(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentSeasonId === null
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="h-3 w-3 inline mr-1" />
            Current
          </button>
          {seasons
            .filter((s) => s.status === "completed")
            .map((s) => (
              <button
                key={s.id}
                onClick={() => onSeasonChange(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentSeasonId === s.id
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
        </div>
      )}
    </motion.div>
  );
}

export function SeasonResultsLeaderboard({ seasonId }: { seasonId: string }) {
  const [results, setResults] = useState<(SeasonResult & { display_name: string; avatar_url: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("season_results")
        .select("*")
        .eq("season_id", seasonId)
        .order("leaderboard_position", { ascending: true })
        .limit(50) as any;

      if (data && data.length > 0) {
        // Fetch display names
        const userIds = data.map((d: any) => d.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
        const enriched = data.map((d: any) => ({
          ...d,
          display_name: profileMap.get(d.user_id)?.display_name ?? "Anonymous",
          avatar_url: profileMap.get(d.user_id)?.avatar_url ?? null,
        }));
        setResults(enriched);
      }
      setLoading(false);
    })();
  }, [seasonId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading season results…</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No results recorded for this season.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated overflow-hidden"
    >
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        <Trophy className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Final Season Standings
        </span>
      </div>
      <div className="divide-y divide-border">
        {results.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.02 }}
            className="grid grid-cols-[2.5rem_1fr_5rem_5rem] items-center px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {r.leaderboard_position <= 3 ? (
                r.leaderboard_position === 1 ? <Crown className="h-4 w-4 text-yellow-500" /> :
                r.leaderboard_position === 2 ? <Medal className="h-4 w-4 text-gray-400" /> :
                <Medal className="h-4 w-4 text-amber-600" />
              ) : (
                `#${r.leaderboard_position}`
              )}
            </span>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                {r.display_name}
              </span>
              <span className={`text-[9px] font-bold shrink-0 ${getRankColor(r.final_rank)}`}>
                [{r.final_rank}]
              </span>
              {r.badge_awarded && (
                <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${getBadgeBorder(r.badge_awarded)}`}>
                  {getBadgeIcon(r.badge_awarded)}
                  {r.badge_awarded}
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-sm font-bold font-heading text-foreground tabular-nums">
                {r.final_elo}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {r.total_sessions} sessions
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
