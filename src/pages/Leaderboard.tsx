import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, LogIn, Flame, ShieldCheck, Shield, TrendingUp, TrendingDown, Minus, Target, Swords, ChevronUp } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Link } from "react-router-dom";
import { EditableProfile } from "@/components/EditableProfile";
import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEloRank, getEloRanks } from "@/lib/elo";
import { EloHistoryChart } from "@/components/practice/EloHistoryChart";
import { WeeklyChallengeBadges } from "@/components/clans/WeeklyChallengeBadges";
import { PlacementProgress, PlacingBadge } from "@/components/practice/PlacementSystem";
import { PLACEMENT_SESSIONS_REQUIRED } from "@/lib/eloSync";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  elo: number;
  total_sessions: number;
  weekly_elo_gain?: number;
  is_evaluator?: boolean;
  clan_name?: string;
}

interface ClanMemberInfo {
  user_id: string;
  clans: { name: string } | { name: string }[] | null;
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

function getRankBorderColor(rank: string) {
  switch (rank) {
    case "Sales Architect": return "border-purple-400/30";
    case "Rainmaker": return "border-yellow-400/30";
    case "Operator": return "border-blue-400/30";
    case "Closer": return "border-primary/30";
    case "Prospector": return "border-orange-400/30";
    default: return "border-border";
  }
}

function MovementIndicator({ gain }: { gain: number }) {
  if (gain > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
        <TrendingUp className="h-3 w-3" />+{gain}
      </span>
    );
  }
  if (gain < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-destructive">
        <TrendingDown className="h-3 w-3" />{gain}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  );
}

type Tab = "all-time" | "weekly";

// Podium card for top 3
function PodiumCard({
  entry,
  position,
  isCurrentUser,
  delay,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  isCurrentUser: boolean;
  delay: number;
}) {
  const rank = getEloRank(entry.elo);
  const isFirst = position === 1;
  const avatarSize = isFirst ? "lg" : "md";
  const medalColors = {
    1: "from-yellow-400/20 to-yellow-600/10 border-yellow-500/30",
    2: "from-gray-300/15 to-gray-500/10 border-gray-400/30",
    3: "from-amber-500/15 to-amber-700/10 border-amber-600/30",
  };
  const medalIcons = {
    1: <Crown className="h-5 w-5 text-yellow-500" />,
    2: <Medal className="h-4 w-4 text-gray-400" />,
    3: <Medal className="h-4 w-4 text-amber-600" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      className={`flex flex-col items-center text-center ${isFirst ? "order-2" : position === 2 ? "order-1" : "order-3"}`}
    >
      {/* Medal */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.15, type: "spring", stiffness: 400 }}
        className="mb-2"
      >
        {medalIcons[position]}
      </motion.div>

      {/* Card */}
      <div
        className={`relative rounded-2xl border bg-gradient-to-b p-4 ${medalColors[position]} ${
          isFirst ? "w-36 pb-5" : "w-28 pb-4"
        } ${isCurrentUser ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}
      >
        <div className="flex justify-center mb-2">
          <UserAvatar
            avatarUrl={entry.avatar_url}
            displayName={entry.display_name}
            elo={entry.elo}
            size={avatarSize}
            showRankBadge={false}
            showName={false}
          />
        </div>

        <p className={`font-semibold text-foreground truncate ${isFirst ? "text-sm" : "text-xs"}`}>
          {entry.display_name}
        </p>

        <p className={`font-bold tabular-nums ${isFirst ? "text-xl" : "text-lg"} font-heading text-foreground mt-1`}>
          {entry.elo}
        </p>

        <span className={`text-[10px] font-bold ${getRankColor(rank)}`}>
          {rank}
        </span>

        {(entry.weekly_elo_gain ?? 0) !== 0 && (
          <div className="mt-1">
            <MovementIndicator gain={entry.weekly_elo_gain ?? 0} />
          </div>
        )}

        {isCurrentUser && (
          <span className="text-[9px] text-muted-foreground mt-0.5 block">(you)</span>
        )}
      </div>

      {/* Position number */}
      <span className={`mt-2 font-bold font-heading ${isFirst ? "text-lg text-foreground" : "text-sm text-muted-foreground"}`}>
        #{position}
      </span>
    </motion.div>
  );
}

// "Players Near You" section with rival + next rank
function NearYouSection({
  entries,
  userRank,
  userId,
  userElo,
  tab,
}: {
  entries: LeaderboardEntry[];
  userRank: number;
  userId: string;
  userElo: number;
  tab: Tab;
}) {
  const userIdx = userRank - 1;

  // 3 above + user + 3 below
  const startIdx = Math.max(0, userIdx - 3);
  const endIdx = Math.min(entries.length, userIdx + 4);
  const nearbyEntries = entries.slice(startIdx, endIdx);

  // Next rank tier
  const ranks = getEloRanks();
  const currentRank = getEloRank(userElo);
  const currentRankIdx = ranks.findIndex((r) => r.name === currentRank);
  const nextRank = currentRankIdx < ranks.length - 1 ? ranks[currentRankIdx + 1] : null;
  const pointsToNext = nextRank ? nextRank.min - userElo : 0;

  // Rival = closest player above
  const rival = userIdx > 0 ? entries[userIdx - 1] : null;
  const rivalGap = rival ? rival.elo - userElo : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      {/* Stats row: Next Rank + Rival */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Next rank progress */}
        {nextRank ? (
          <div className="card-elevated p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              Next Rank
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${getRankColor(nextRank.name)}`}>
                {nextRank.name}
              </span>
              <span className="text-xs text-muted-foreground font-semibold tabular-nums">
                {pointsToNext} pts away
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, ((userElo - ranks[currentRankIdx].min) / (nextRank.min - ranks[currentRankIdx].min)) * 100)}%`,
                }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
        ) : (
          <div className="card-elevated p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-bold text-foreground">Max Rank!</p>
              <p className="text-[10px] text-muted-foreground">You've reached Sales Architect</p>
            </div>
          </div>
        )}

        {/* Your rival */}
        {rival ? (
          <div className="card-elevated p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Swords className="h-3.5 w-3.5 text-destructive" />
              Your Rival
            </div>
            <div className="flex items-center gap-2">
              <UserAvatar
                avatarUrl={rival.avatar_url}
                displayName={rival.display_name}
                elo={rival.elo}
                size="xs"
                showRankBadge={false}
                showName={false}
              />
              <span className="text-sm font-semibold text-foreground truncate">
                {rival.display_name}
              </span>
              <span className={`text-[9px] font-bold ${getRankColor(getEloRank(rival.elo))}`}>
                [{getEloRank(rival.elo)}]
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Their ELO: <span className="font-bold text-foreground tabular-nums">{rival.elo}</span></span>
              <span className="text-primary font-bold tabular-nums flex items-center gap-0.5">
                <ChevronUp className="h-3 w-3" />{rivalGap} to overtake
              </span>
            </div>
          </div>
        ) : (
          <div className="card-elevated p-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">#1 Player!</p>
              <p className="text-[10px] text-muted-foreground">You're at the top</p>
            </div>
          </div>
        )}
      </div>

      {/* Players near you */}
      <div className="card-elevated overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Players Near You
          </span>
        </div>
        <div className="divide-y divide-border">
          {nearbyEntries.map((entry) => {
            const rank = getEloRank(entry.elo);
            const globalIdx = entries.indexOf(entry);
            const isCurrentUser = entry.id === userId;

            return (
              <div
                key={entry.id}
                className={`grid grid-cols-[2.5rem_1fr_4.5rem_4rem] items-center px-4 py-2.5 transition-colors ${
                  isCurrentUser
                    ? "bg-primary/8 border-l-2 border-l-primary"
                    : "hover:bg-muted/30"
                }`}
              >
                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                  {globalIdx + 1}
                </span>

                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    avatarUrl={entry.avatar_url}
                    displayName={entry.display_name}
                    elo={entry.elo}
                    size="xs"
                    showRankBadge={false}
                    showName={false}
                  />
                  <span className={`text-sm font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                    {entry.display_name}
                  </span>
                  {entry.total_sessions < PLACEMENT_SESSIONS_REQUIRED ? (
                    <PlacingBadge />
                  ) : (
                    <span className={`text-[9px] font-bold shrink-0 ${getRankColor(rank)}`}>
                      [{rank}]
                    </span>
                  )}
                  {isCurrentUser && <span className="text-[9px] text-muted-foreground shrink-0">(you)</span>}
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-heading text-foreground tabular-nums">
                    {entry.elo}
                  </span>
                </div>

                <div className="text-right">
                  <MovementIndicator gain={entry.weekly_elo_gain ?? 0} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const LeaderboardPage = () => {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("all-time");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      const orderCol = tab === "weekly" ? "weekly_elo_gain" : "elo";
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, elo, total_sessions, weekly_elo_gain, is_evaluator")
        .order(orderCol, { ascending: false })
        .limit(50);

      if (data) {
        const filtered = tab === "weekly"
          ? data.filter((e) => (e.weekly_elo_gain ?? 0) > 0)
          : data;

        const userIds = filtered.map((e) => e.id);
        const { data: clanData } = await supabase
          .from("clan_members")
          .select("user_id, clans:clan_id(name)")
          .in("user_id", userIds);

        const clanMap = new Map<string, string>();
        if (clanData) {
          for (const cm of clanData as unknown as ClanMemberInfo[]) {
            const clan = Array.isArray(cm.clans) ? cm.clans[0] : cm.clans;
            if (clan?.name) clanMap.set(cm.user_id, clan.name);
          }
        }

        const enriched: LeaderboardEntry[] = filtered.map((e) => ({
          ...e,
          clan_name: clanMap.get(e.id),
        }));

        setEntries(enriched);
        if (user) {
          const idx = enriched.findIndex((e) => e.id === user.id);
          setUserRank(idx >= 0 ? idx + 1 : null);
        }
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [user, tab]);

  const podiumEntries = entries.slice(0, 3);
  const listEntries = entries.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Trophy className="h-7 w-7 text-primary" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Compete against other players. Climb the ranks.
            </p>
          </div>

          {/* User card or sign-in prompt */}
          {user && profile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="card-elevated p-5 flex items-center gap-4"
            >
              <UserAvatar
                avatarUrl={profile.avatar_url}
                displayName={profile.display_name}
                elo={profile.elo}
                size="lg"
                showRankBadge={false}
              />
              <div className="flex-1 min-w-0">
                <EditableProfile />
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-2xl font-bold font-heading text-foreground">{profile.elo}</span>
                  {profile.total_sessions < PLACEMENT_SESSIONS_REQUIRED ? (
                    <PlacingBadge />
                  ) : (
                    <Badge variant="outline" className={`text-[10px] font-semibold border-primary/40 ${getRankColor(getEloRank(profile.elo))}`}>
                      {getEloRank(profile.elo)}
                    </Badge>
                  )}
                  {userRank && (
                    <span className="text-xs text-muted-foreground">
                      #{userRank} {tab === "weekly" ? "this week" : "overall"}
                    </span>
                  )}
                  {userRank && entries[userRank - 1] && (
                    <MovementIndicator gain={entries[userRank - 1].weekly_elo_gain ?? 0} />
                  )}
                </div>
              </div>
            </motion.div>
          ) : user && profile && profile.total_sessions < PLACEMENT_SESSIONS_REQUIRED ? (
            <PlacementProgress
              totalSessions={profile.total_sessions}
              elo={profile.elo}
              avatarUrl={profile.avatar_url}
              displayName={profile.display_name}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="card-elevated p-6 text-center space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Sign in to track your ELO rating and appear on the leaderboard.
              </p>
              <Button variant="default" size="sm" asChild>
                <Link to="/login" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            </motion.div>
          )}

          {/* Players Near You + Next Rank + Rival */}
          {user && profile && userRank !== null && entries.length > 0 && (
            <NearYouSection
              entries={entries}
              userRank={userRank}
              userId={user.id}
              userElo={profile.elo}
              tab={tab}
            />
          )}

          {/* ELO History Chart */}
          <EloHistoryChart />

          {/* Tab switcher */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setTab("all-time")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "all-time"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="h-3.5 w-3.5 inline mr-1.5" />
              All Time
            </button>
            <button
              onClick={() => setTab("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "weekly"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="h-3.5 w-3.5 inline mr-1.5" />
              This Week
            </button>
          </div>

          {/* Rank tiers legend */}
          <div className="flex flex-wrap justify-center gap-2">
            {ELO_RANKS.map((r) => (
              <span key={r.name} className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-muted ${getRankColor(r.name)}`}>
                {r.name} ({r.min}+)
              </span>
            ))}
          </div>

          {/* Leaderboard content */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading leaderboard…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {tab === "weekly"
                  ? "No activity this week yet. Be the first to "
                  : "No players yet. Be the first to "}
                <Link to="/practice" className="text-primary hover:underline">practice</Link>!
              </p>
            </div>
          ) : (
            <>
              {/* Podium for top 3 */}
              {podiumEntries.length >= 3 && (
                <div className="flex items-end justify-center gap-4 pt-4 pb-2">
                  {[1, 0, 2].map((idx) => (
                    <PodiumCard
                      key={podiumEntries[idx].id}
                      entry={podiumEntries[idx]}
                      position={(idx + 1) as 1 | 2 | 3}
                      isCurrentUser={user?.id === podiumEntries[idx].id}
                      delay={0.1 + idx * 0.08}
                    />
                  ))}
                </div>
              )}

              {/* Podium fallback for < 3 entries */}
              {podiumEntries.length > 0 && podiumEntries.length < 3 && (
                <div className="flex items-end justify-center gap-4 pt-4 pb-2">
                  {podiumEntries.map((entry, idx) => (
                    <PodiumCard
                      key={entry.id}
                      entry={entry}
                      position={(idx + 1) as 1 | 2 | 3}
                      isCurrentUser={user?.id === entry.id}
                      delay={0.1 + idx * 0.08}
                    />
                  ))}
                </div>
              )}

              {/* Remaining players list */}
              {listEntries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card-elevated overflow-hidden"
                >
                  {/* Table header */}
                  <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4rem] md:grid-cols-[2.5rem_1fr_4.5rem_5rem_4rem] items-center px-4 py-2.5 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>#</span>
                    <span>Player</span>
                    <span className="text-right">ELO</span>
                    <span className="hidden md:block text-right">Sessions</span>
                    <span className="text-right">Move</span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-border">
                    {listEntries.map((entry, i) => {
                      const rank = getEloRank(entry.elo);
                      const actualIndex = i + 3;
                      const isCurrentUser = user?.id === entry.id;

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.02 }}
                          className={`grid grid-cols-[2.5rem_1fr_4.5rem_4rem] md:grid-cols-[2.5rem_1fr_4.5rem_5rem_4rem] items-center px-4 py-2.5 transition-colors ${
                            isCurrentUser
                              ? "bg-primary/5 border-l-2 border-l-primary"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <span className="text-xs font-bold text-muted-foreground tabular-nums">
                            {actualIndex + 1}
                          </span>

                          <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar
                              avatarUrl={entry.avatar_url}
                              displayName={entry.display_name}
                              elo={entry.elo}
                              size="xs"
                              showRankBadge={false}
                              showName={false}
                            />
                            <span className={`text-sm font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                              {entry.display_name}
                            </span>
                            {entry.total_sessions < PLACEMENT_SESSIONS_REQUIRED ? (
                              <PlacingBadge />
                            ) : (
                              <span className={`text-[9px] font-bold shrink-0 ${getRankColor(rank)}`}>
                                [{rank}]
                              </span>
                            )}
                            {isCurrentUser && <span className="text-[9px] text-muted-foreground shrink-0">(you)</span>}
                            {entry.is_evaluator && (
                              <ShieldCheck className="h-3 w-3 text-blue-400 shrink-0" />
                            )}
                            {entry.clan_name && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 gap-0.5 border-primary/30 text-primary shrink-0 hidden md:inline-flex">
                                <Shield className="h-2 w-2" />
                                {entry.clan_name}
                              </Badge>
                            )}
                            <WeeklyChallengeBadges userId={entry.id} compact />
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold font-heading text-foreground tabular-nums">
                              {entry.elo}
                            </span>
                          </div>

                          <div className="hidden md:block text-right">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {entry.total_sessions}
                            </span>
                          </div>

                          <div className="text-right">
                            <MovementIndicator gain={entry.weekly_elo_gain ?? 0} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* Live Activity Feed sidebar */}
        <div className="hidden lg:block sticky top-24 self-start">
          <LiveActivityFeed />
        </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
