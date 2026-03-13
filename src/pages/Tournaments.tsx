import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Swords, Users, Clock, Crown, Medal, ChevronRight, LogIn, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import Navbar from "@/components/landing/Navbar";
import { getEloRank } from "@/lib/elo";
import { toast } from "sonner";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  scenario_role: string;
  scenario_env: string;
  max_players: number;
  current_round: number;
  total_rounds: number;
  status: string;
  created_by: string;
  starts_at: string;
  ended_at: string | null;
  winner_id: string | null;
  created_at: string;
}

interface Participant {
  id: string;
  tournament_id: string;
  user_id: string;
  seed: number | null;
  eliminated_in_round: number | null;
  profile?: {
    display_name: string;
    avatar_url: string | null;
    elo: number;
  };
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_index: number;
  player_a_id: string | null;
  player_b_id: string | null;
  player_a_score: number | null;
  player_b_score: number | null;
  winner_id: string | null;
  status: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "upcoming": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "active": return "bg-primary/10 text-primary border-primary/30";
    case "completed": return "bg-muted text-muted-foreground border-border";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "upcoming": return "Registration Open";
    case "active": return "Live";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    default: return status;
  }
}

function getRoundLabel(round: number, totalRounds: number) {
  const remaining = totalRounds - round;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinals";
  if (remaining === 2) return "Quarterfinals";
  return `Round ${round + 1}`;
}

function TournamentCard({
  tournament,
  participantCount,
  isJoined,
  onJoin,
  onView,
  userId,
}: {
  tournament: Tournament;
  participantCount: number;
  isJoined: boolean;
  onJoin: () => void;
  onView: () => void;
  userId?: string;
}) {
  const startsAt = new Date(tournament.starts_at);
  const isUpcoming = tournament.status === "upcoming";
  const isFull = participantCount >= tournament.max_players;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-5 space-y-4 cursor-pointer hover:border-primary/20 transition-colors"
      onClick={onView}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">{tournament.title}</h3>
          </div>
          {tournament.description && (
            <p className="text-xs text-muted-foreground">{tournament.description}</p>
          )}
        </div>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${getStatusColor(tournament.status)}`}>
          {getStatusLabel(tournament.status)}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {participantCount}/{tournament.max_players}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {startsAt.toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" />
          {tournament.total_rounds} rounds
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {tournament.scenario_role} · {tournament.scenario_env}
        </span>
        {isUpcoming && userId && !isJoined && !isFull && (
          <Button
            size="sm"
            variant="default"
            className="text-xs h-7"
            onClick={(e) => { e.stopPropagation(); onJoin(); }}
          >
            Join Tournament
          </Button>
        )}
        {isJoined && (
          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Joined</Badge>
        )}
        {isFull && !isJoined && isUpcoming && (
          <Badge variant="outline" className="text-[10px]">Full</Badge>
        )}
        {tournament.status !== "upcoming" && (
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={(e) => { e.stopPropagation(); onView(); }}>
            View Bracket <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    fetchTournaments();
  }, [user]);

  async function fetchTournaments() {
    setLoading(true);
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("starts_at", { ascending: false });

    if (data) {
      setTournaments(data as Tournament[]);

      // Fetch participant counts
      const ids = data.map((t: any) => t.id);
      if (ids.length > 0) {
        const { data: parts } = await supabase
          .from("tournament_participants")
          .select("tournament_id, user_id")
          .in("tournament_id", ids);

        if (parts) {
          const counts: Record<string, number> = {};
          const joined = new Set<string>();
          for (const p of parts) {
            counts[p.tournament_id] = (counts[p.tournament_id] || 0) + 1;
            if (user && p.user_id === user.id) joined.add(p.tournament_id);
          }
          setParticipantCounts(counts);
          setJoinedIds(joined);
        }
      }
    }
    setLoading(false);
  }

  async function joinTournament(tournamentId: string) {
    if (!user) return;
    const { error } = await supabase
      .from("tournament_participants")
      .insert({ tournament_id: tournamentId, user_id: user.id });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already joined" : "Failed to join");
      return;
    }
    toast.success("Joined tournament!");
    setJoinedIds((prev) => new Set(prev).add(tournamentId));
    setParticipantCounts((prev) => ({
      ...prev,
      [tournamentId]: (prev[tournamentId] || 0) + 1,
    }));
  }

  async function viewBracket(tournamentId: string) {
    setSelectedTournament(tournamentId);

    const [{ data: matchData }, { data: partData }] = await Promise.all([
      supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round")
        .order("match_index"),
      supabase
        .from("tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentId),
    ]);

    if (matchData) setMatches(matchData as TournamentMatch[]);

    if (partData) {
      // Enrich with profile data
      const userIds = partData.map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, elo")
        .in("id", userIds);

      const profileMap = new Map<string, any>();
      if (profiles) profiles.forEach((p) => profileMap.set(p.id, p));

      setParticipants(
        partData.map((p: any) => ({
          ...p,
          profile: profileMap.get(p.user_id),
        }))
      );
    }
  }

  const selectedTournamentData = tournaments.find((t) => t.id === selectedTournament);

  const filteredTournaments = tournaments.filter((t) => {
    if (tab === "upcoming") return t.status === "upcoming";
    if (tab === "active") return t.status === "active";
    return t.status === "completed";
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 max-w-4xl">
        {selectedTournament && selectedTournamentData ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setSelectedTournament(null)}
            >
              ← Back to Tournaments
            </Button>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Swords className="h-6 w-6 text-primary" />
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {selectedTournamentData.title}
                </h1>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className={`text-[10px] ${getStatusColor(selectedTournamentData.status)}`}>
                  {getStatusLabel(selectedTournamentData.status)}
                </Badge>
                <span>{participants.length} players</span>
                <span>{selectedTournamentData.total_rounds} rounds</span>
              </div>
              {selectedTournamentData.winner_id && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-bold text-foreground">
                    Winner: {participants.find((p) => p.user_id === selectedTournamentData.winner_id)?.profile?.display_name || "Unknown"}
                  </span>
                </div>
              )}
            </div>

            <TournamentBracket
              matches={matches}
              participants={participants}
              totalRounds={selectedTournamentData.total_rounds}
              currentRound={selectedTournamentData.current_round}
            />

            {/* Participants list */}
            <div className="card-elevated overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Players ({participants.length})
                </span>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {participants
                  .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
                  .map((p) => {
                    const rank = p.profile ? getEloRank(p.profile.elo) : "Rookie";
                    const eliminated = p.eliminated_in_round !== null;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 px-4 py-2.5 ${eliminated ? "opacity-40" : ""}`}
                      >
                        {p.seed && (
                          <span className="text-[10px] font-bold text-muted-foreground w-5 text-center tabular-nums">
                            #{p.seed}
                          </span>
                        )}
                        <UserAvatar
                          avatarUrl={p.profile?.avatar_url ?? null}
                          displayName={p.profile?.display_name ?? "Unknown"}
                          elo={p.profile?.elo ?? 1000}
                          size="xs"
                          showRankBadge={false}
                          showName={false}
                        />
                        <span className="text-sm font-semibold text-foreground truncate flex-1">
                          {p.profile?.display_name ?? "Unknown"}
                        </span>
                        <span className="text-[10px] font-bold text-primary tabular-nums">
                          {p.profile?.elo ?? 1000}
                        </span>
                        {eliminated && (
                          <Badge variant="outline" className="text-[8px] px-1.5 border-destructive/30 text-destructive">
                            Eliminated R{p.eliminated_in_round}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-3">
                <Swords className="h-7 w-7 text-primary" />
                Tournaments
              </h1>
              <p className="text-sm text-muted-foreground">
                Compete in bracket-style elimination tournaments. Prove you're the best.
              </p>
            </div>

            {!user && (
              <div className="card-elevated p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Sign in to join tournaments.</p>
                <Button variant="default" size="sm" asChild>
                  <Link to="/login" className="gap-2">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Link>
                </Button>
              </div>
            )}

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full justify-center">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="active">Live</TabsTrigger>
                <TabsTrigger value="completed">Past</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="space-y-3 mt-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : filteredTournaments.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {tab === "upcoming"
                        ? "No upcoming tournaments yet. Check back soon!"
                        : tab === "active"
                        ? "No live tournaments right now."
                        : "No completed tournaments yet."}
                    </p>
                  </div>
                ) : (
                  filteredTournaments.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      participantCount={participantCounts[t.id] || 0}
                      isJoined={joinedIds.has(t.id)}
                      onJoin={() => joinTournament(t.id)}
                      onView={() => viewBracket(t.id)}
                      userId={user?.id}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
}
