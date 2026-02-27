import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadConsistency, type ConsistencyData } from "@/components/practice/consistencyScoring";
import { loadHistory } from "@/components/practice/sessionStorage";
import { roles } from "@/components/practice/roleData";
import type { SessionRecord } from "@/components/practice/types";

export function LeaderboardWidget() {
  const [consistency, setConsistency] = useState<ConsistencyData | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setConsistency(loadConsistency());
    setSessions(loadHistory());
  }, []);

  // Filter sessions from this week
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weeklySessions = sessions.filter((s) => new Date(s.date) >= monday);
  const topWeekly = weeklySessions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!consistency || (consistency.totalSessions === 0 && topWeekly.length === 0)) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto card-elevated p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              This Week
            </h3>
            <Button variant="ghost" size="sm" className="text-xs text-primary" asChild>
              <a href="/leaderboard">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Streak:</span>
              <span className="font-bold text-foreground">{consistency.currentStreak}d</span>
            </div>
            <div className="text-muted-foreground">·</div>
            <div>
              <span className="text-muted-foreground">Score:</span>{" "}
              <span className="font-bold text-primary">{consistency.score}</span>
            </div>
          </div>

          {/* Top 5 this week */}
          {topWeekly.length > 0 ? (
            <div className="space-y-1">
              {topWeekly.map((s, i) => {
                const role = roles.find((r) => r.id === s.roleId);
                const Icon = role?.icon;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground w-5 text-center font-bold">
                      {i + 1}
                    </span>
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <span className="text-xs text-foreground font-medium flex-1 truncate">
                      {s.roleTitle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.rank}
                    </span>
                    <span className="text-sm font-bold font-heading text-primary">
                      {s.score}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No sessions this week yet.{" "}
              <a href="/practice" className="text-primary hover:underline">
                Start practicing
              </a>
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
