import { motion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

interface TournamentMatch {
  id: string;
  round: number;
  match_index: number;
  player_a_id: string | null;
  player_b_id: string | null;
  player_a_score: number | null;
  player_b_score: number | null;
  winner_id: string | null;
  status: string;
}

interface Participant {
  user_id: string;
  seed: number | null;
  profile?: {
    display_name: string;
    avatar_url: string | null;
    elo: number;
  };
}

function getRoundLabel(round: number, totalRounds: number) {
  const remaining = totalRounds - round - 1;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinals";
  if (remaining === 2) return "Quarterfinals";
  return `Round ${round + 1}`;
}

function PlayerSlot({
  participant,
  score,
  isWinner,
  isBye,
}: {
  participant?: Participant;
  score: number | null;
  isWinner: boolean;
  isBye: boolean;
}) {
  if (isBye || !participant) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 border border-border/30 min-w-[180px]">
        <span className="text-[10px] text-muted-foreground/50 italic">
          {isBye ? "BYE" : "TBD"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md border min-w-[180px] transition-colors ${
        isWinner
          ? "bg-primary/10 border-primary/30"
          : "bg-card border-border/50 hover:border-border"
      }`}
    >
      <UserAvatar
        avatarUrl={participant.profile?.avatar_url ?? null}
        displayName={participant.profile?.display_name ?? "Unknown"}
        elo={participant.profile?.elo ?? 1000}
        size="xs"
        showRankBadge={false}
        showName={false}
      />
      <span className={`text-xs font-semibold truncate flex-1 ${isWinner ? "text-primary" : "text-foreground"}`}>
        {participant.profile?.display_name ?? "Unknown"}
      </span>
      {score !== null && (
        <span className={`text-xs font-bold tabular-nums ${isWinner ? "text-primary" : "text-muted-foreground"}`}>
          {score}
        </span>
      )}
      {isWinner && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
    </div>
  );
}

function MatchCard({
  match,
  participantMap,
  delay,
}: {
  match: TournamentMatch;
  participantMap: Map<string, Participant>;
  delay: number;
}) {
  const playerA = match.player_a_id ? participantMap.get(match.player_a_id) : undefined;
  const playerB = match.player_b_id ? participantMap.get(match.player_b_id) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex flex-col gap-1"
    >
      <PlayerSlot
        participant={playerA}
        score={match.player_a_score}
        isWinner={match.winner_id === match.player_a_id && match.winner_id !== null}
        isBye={!match.player_a_id && match.status !== "pending"}
      />
      <div className="flex items-center gap-1 px-2">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[8px] text-muted-foreground font-semibold uppercase">vs</span>
        <div className="h-px flex-1 bg-border/50" />
      </div>
      <PlayerSlot
        participant={playerB}
        score={match.player_b_score}
        isWinner={match.winner_id === match.player_b_id && match.winner_id !== null}
        isBye={!match.player_b_id && match.status !== "pending"}
      />
    </motion.div>
  );
}

export function TournamentBracket({
  matches,
  participants,
  totalRounds,
  currentRound,
}: {
  matches: TournamentMatch[];
  participants: Participant[];
  totalRounds: number;
  currentRound: number;
}) {
  const participantMap = new Map<string, Participant>();
  participants.forEach((p) => participantMap.set(p.user_id, p));

  // Group matches by round
  const rounds = new Map<number, TournamentMatch[]>();
  matches.forEach((m) => {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round)!.push(m);
  });

  if (matches.length === 0) {
    return (
      <div className="card-elevated p-8 text-center space-y-3">
        <Trophy className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Bracket will be generated when the tournament starts.
        </p>
        <p className="text-xs text-muted-foreground/60">
          {participants.length} player{participants.length !== 1 ? "s" : ""} registered
        </p>
      </div>
    );
  }

  const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {roundNumbers.map((roundNum) => {
          const roundMatches = rounds.get(roundNum) ?? [];
          const isCurrent = roundNum === currentRound;

          return (
            <div key={roundNum} className="flex flex-col items-center gap-4 min-w-[220px]">
              {/* Round header */}
              <div className={`text-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isCurrent
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground"
              }`}>
                {getRoundLabel(roundNum, totalRounds)}
              </div>

              {/* Matches */}
              <div className="flex flex-col justify-around flex-1 gap-6">
                {roundMatches
                  .sort((a, b) => a.match_index - b.match_index)
                  .map((match, i) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      participantMap={participantMap}
                      delay={roundNum * 0.1 + i * 0.03}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
