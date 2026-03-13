import { motion } from "framer-motion";
import { Ghost, Swords, Trophy, TrendingDown, Equal } from "lucide-react";
import type { GhostOpponent } from "./useGhostBattle";

interface GhostBattleBannerProps {
  ghost: GhostOpponent;
}

export function GhostBattleBanner({ ghost }: GhostBattleBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <Ghost className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Ghost Battle</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          {ghost.avatar_url ? (
            <img src={ghost.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
          ) : (
            <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
              <Ghost className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          )}
          <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[100px]">
            {ghost.display_name}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          scored <span className="font-bold text-foreground">{ghost.score}</span>
        </span>
      </div>
    </motion.div>
  );
}

interface GhostBattleResultProps {
  userScore: number;
  ghostScore: number;
  ghostName: string;
  ghostAvatar: string | null;
  beatGhost: boolean;
  tied: boolean;
  eloDelta: number;
}

export function GhostBattleResult({
  userScore,
  ghostScore,
  ghostName,
  ghostAvatar,
  beatGhost,
  tied,
  eloDelta,
}: GhostBattleResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card-elevated px-4 py-3 border ${
        beatGhost
          ? "border-primary/30 bg-primary/5"
          : tied
          ? "border-border bg-secondary/30"
          : "border-destructive/20 bg-destructive/5"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Ghost className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Ghost Battle Result
          </span>
        </div>
        {beatGhost && (
          <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Trophy className="h-2.5 w-2.5" /> YOU WON
          </span>
        )}
        {tied && (
          <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
            <Equal className="h-2.5 w-2.5" /> TIE
          </span>
        )}
        {!beatGhost && !tied && (
          <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingDown className="h-2.5 w-2.5" /> LOST
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Your Score</p>
          <p
            className={`text-xl font-bold font-heading ${
              beatGhost ? "text-primary" : tied ? "text-foreground" : "text-foreground"
            }`}
          >
            {userScore}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            {ghostAvatar ? (
              <img src={ghostAvatar} alt="" className="h-3 w-3 rounded-full object-cover inline" />
            ) : (
              <Ghost className="h-3 w-3 text-muted-foreground inline" />
            )}
            {ghostName}
          </p>
          <p className="text-xl font-bold font-heading text-muted-foreground">{ghostScore}</p>
        </div>
      </div>

      <p
        className={`text-[11px] font-semibold text-center mt-2 ${
          eloDelta >= 0 ? "text-primary" : "text-destructive"
        }`}
      >
        {eloDelta >= 0 ? "+" : ""}
        {eloDelta} ELO from Ghost Battle
      </p>
    </motion.div>
  );
}
