import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Swords, Shield, Users, Flame, Trophy, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface RivalryData {
  id: string;
  clan_a_id: string;
  clan_b_id: string;
  clan_a_score: number;
  clan_b_score: number;
  clan_a_sessions: number;
  clan_b_sessions: number;
  week_start: string;
  status: string;
  clan_a_name?: string;
  clan_b_name?: string;
  clan_a_members?: number;
  clan_b_members?: number;
}

function getTimeUntilSunday() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysLeft = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfSunday = new Date(now);
  endOfSunday.setUTCDate(now.getUTCDate() + daysLeft);
  endOfSunday.setUTCHours(23, 59, 59, 999);
  const diff = endOfSunday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h`;
}

export function ClanRivalry({ clanId }: { clanId?: string }) {
  const { user } = useAuth();
  const [rivalry, setRivalry] = useState<RivalryData | null>(null);
  const [allRivalries, setAllRivalries] = useState<RivalryData[]>([]);
  const [userClanId, setUserClanId] = useState<string | null>(clanId ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRivalries();
  }, [user, clanId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("clan-rivalries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clan_rivalries" },
        () => fetchRivalries()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchRivalries() {
    setLoading(true);

    // Get user's clan if not provided
    let myClanId = clanId ?? null;
    if (!myClanId && user) {
      const { data: membership } = await supabase
        .from("clan_members")
        .select("clan_id")
        .eq("user_id", user.id)
        .maybeSingle();
      myClanId = membership?.clan_id ?? null;
      setUserClanId(myClanId);
    }

    // Current week
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - mondayOffset);
    thisMonday.setUTCHours(0, 0, 0, 0);
    const weekStart = thisMonday.toISOString().split("T")[0];

    // Fetch all active rivalries for this week
    const { data: rivalries } = await supabase
      .from("clan_rivalries")
      .select("*")
      .eq("week_start", weekStart)
      .eq("status", "active");

    if (rivalries && rivalries.length > 0) {
      // Collect all clan IDs
      const clanIds = new Set<string>();
      for (const r of rivalries) {
        clanIds.add(r.clan_a_id);
        clanIds.add(r.clan_b_id);
      }

      const { data: clans } = await supabase
        .from("clans")
        .select("id, name, total_members")
        .in("id", [...clanIds]);

      const clanMap = new Map((clans ?? []).map((c) => [c.id, c]));

      const enriched: RivalryData[] = rivalries.map((r) => ({
        ...r,
        clan_a_name: clanMap.get(r.clan_a_id)?.name ?? "Unknown",
        clan_b_name: clanMap.get(r.clan_b_id)?.name ?? "Unknown",
        clan_a_members: clanMap.get(r.clan_a_id)?.total_members ?? 0,
        clan_b_members: clanMap.get(r.clan_b_id)?.total_members ?? 0,
      }));

      setAllRivalries(enriched);

      // Find user's rivalry
      if (myClanId) {
        const myRivalry = enriched.find(
          (r) => r.clan_a_id === myClanId || r.clan_b_id === myClanId
        );
        setRivalry(myRivalry ?? null);
      }
    } else {
      setAllRivalries([]);
      setRivalry(null);
    }

    setLoading(false);
  }

  if (loading) return null;

  const timeLeft = getTimeUntilSunday();
  const showUserRivalry = rivalry && userClanId;

  return (
    <div className="space-y-4">
      {/* Your clan's rivalry - featured */}
      {showUserRivalry && (
        <RivalryCard
          rivalry={rivalry}
          userClanId={userClanId}
          featured
          timeLeft={timeLeft}
        />
      )}

      {/* All other rivalries */}
      {allRivalries.filter((r) => r.id !== rivalry?.id).length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Other Matchups
          </p>
          {allRivalries
            .filter((r) => r.id !== rivalry?.id)
            .map((r) => (
              <RivalryCard
                key={r.id}
                rivalry={r}
                userClanId={userClanId}
                timeLeft={timeLeft}
              />
            ))}
        </div>
      )}

      {allRivalries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-5 text-center"
        >
          <Swords className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No rivalries this week yet. Matchups are created automatically.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function RivalryCard({
  rivalry,
  userClanId,
  featured = false,
  timeLeft,
}: {
  rivalry: RivalryData;
  userClanId: string | null;
  featured?: boolean;
  timeLeft: string;
}) {
  const isUserClanA = userClanId === rivalry.clan_a_id;
  const isUserClanB = userClanId === rivalry.clan_b_id;
  const isUserInvolved = isUserClanA || isUserClanB;

  const totalScore = rivalry.clan_a_score + rivalry.clan_b_score;
  const progressA = totalScore > 0 ? (rivalry.clan_a_score / totalScore) * 100 : 50;

  const aWinning = rivalry.clan_a_score > rivalry.clan_b_score;
  const bWinning = rivalry.clan_b_score > rivalry.clan_a_score;
  const tied = rivalry.clan_a_score === rivalry.clan_b_score;

  const userWinning = (isUserClanA && aWinning) || (isUserClanB && bWinning);
  const userLosing = (isUserClanA && bWinning) || (isUserClanB && aWinning);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-elevated overflow-hidden ${
        featured
          ? isUserInvolved
            ? userWinning
              ? "border-primary/30"
              : userLosing
                ? "border-destructive/20"
                : "border-border"
            : ""
          : ""
      }`}
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">
            {featured ? "Your Rivalry" : "Head-to-Head"}
          </span>
          {featured && isUserInvolved && (
            <Badge
              variant="outline"
              className={`text-[9px] px-1.5 py-0 h-4 ${
                userWinning
                  ? "border-primary/40 text-primary"
                  : userLosing
                    ? "border-destructive/40 text-destructive"
                    : "border-border text-muted-foreground"
              }`}
            >
              {userWinning ? "Winning!" : userLosing ? "Behind" : "Tied"}
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-primary/30 text-primary">
          <Clock className="h-2.5 w-2.5" />
          {timeLeft}
        </Badge>
      </div>

      {/* Scoreboard */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          {/* Clan A */}
          <div className={`flex items-center gap-2 min-w-0 flex-1 ${isUserClanA ? "" : ""}`}>
            <Shield className={`h-4 w-4 shrink-0 ${isUserClanA ? "text-primary" : "text-muted-foreground"}`} />
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${isUserClanA ? "text-primary" : "text-foreground"}`}>
                {rivalry.clan_a_name}
              </p>
              <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                <Users className="h-2.5 w-2.5" />
                {rivalry.clan_a_members} members
              </p>
            </div>
          </div>

          {/* VS */}
          <div className="px-4 text-center shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">VS</p>
          </div>

          {/* Clan B */}
          <div className={`flex items-center gap-2 min-w-0 flex-1 justify-end text-right`}>
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${isUserClanB ? "text-primary" : "text-foreground"}`}>
                {rivalry.clan_b_name}
              </p>
              <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end">
                <Users className="h-2.5 w-2.5" />
                {rivalry.clan_b_members} members
              </p>
            </div>
            <Shield className={`h-4 w-4 shrink-0 ${isUserClanB ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-left">
            <span className={`text-xl font-bold font-heading tabular-nums ${
              aWinning ? "text-primary" : "text-foreground"
            }`}>
              {rivalry.clan_a_score.toLocaleString()}
            </span>
            <span className="text-[9px] text-muted-foreground ml-1.5">
              {rivalry.clan_a_sessions} sessions
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-muted-foreground mr-1.5">
              {rivalry.clan_b_sessions} sessions
            </span>
            <span className={`text-xl font-bold font-heading tabular-nums ${
              bWinning ? "text-primary" : "text-foreground"
            }`}>
              {rivalry.clan_b_score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: "50%" }}
            animate={{ width: `${progressA}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              tied
                ? "bg-muted-foreground/40"
                : aWinning
                  ? "bg-primary"
                  : "bg-destructive/60"
            }`}
          />
          <motion.div
            initial={{ width: "50%" }}
            animate={{ width: `${100 - progressA}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`absolute inset-y-0 right-0 rounded-full ${
              tied
                ? "bg-muted-foreground/40"
                : bWinning
                  ? "bg-primary"
                  : "bg-destructive/60"
            }`}
          />
        </div>

        {/* Call to action */}
        {featured && isUserInvolved && (
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            <Flame className="h-3 w-3 inline text-primary mr-1" />
            Complete simulations to earn points for your clan!
          </p>
        )}
      </div>
    </motion.div>
  );
}
