import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, TrendingUp, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionRecord } from "./types";
import { roles } from "./roleData";
import { clearHistory } from "./sessionStorage";

function getRankColor(rank: string) {
  switch (rank) {
    case "Rainmaker":
    case "Operator":
      return "text-primary";
    case "Closer":
      return "text-accent-foreground";
    default:
      return "text-muted-foreground";
  }
}

function SkillBreakdownPanel({
  session,
  onClose,
}: {
  session: SessionRecord;
  onClose: () => void;
}) {
  const skills = session.skillBreakdown || [];
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mx-3 mb-2 p-3 rounded-lg border border-border bg-muted/20 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">{session.roleTitle}</p>
            <p className="text-[10px] text-muted-foreground">
              {dateStr} {timeStr} · {session.rank} · Score {session.score}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>

        {skills.length > 0 ? (
          <div className="space-y-2">
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{skill.name}</span>
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      skill.score >= 70 ? "text-primary" : skill.score >= 50 ? "text-foreground" : "text-destructive"
                    }`}
                  >
                    {skill.score}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.score}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      skill.score >= 70 ? "bg-primary" : skill.score >= 50 ? "bg-primary/50" : "bg-destructive/60"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/60 text-center py-2">
            No skill data for this session
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function SessionHistory({
  sessions,
  onClear,
}: {
  sessions: SessionRecord[];
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (sessions.length === 0) return null;

  const avg = sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length;

  const recent = sessions.slice(0, 5);
  const older = sessions.slice(5, 10);
  const recentAvg =
    recent.length > 0
      ? recent.reduce((s, r) => s + r.score, 0) / recent.length
      : 0;
  const olderAvg =
    older.length > 0
      ? older.reduce((s, r) => s + r.score, 0) / older.length
      : 0;
  const trend = older.length > 0 ? recentAvg - olderAvg : 0;

  const handleClear = () => {
    clearHistory();
    onClear();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated overflow-hidden"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-heading text-sm font-bold text-foreground">
            Session History
          </h3>
          <span className="text-xs text-muted-foreground">
            ({sessions.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground font-medium">
              Avg: {Math.round(avg)}/100
            </span>
            {trend !== 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
                  trend > 0
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <TrendingUp
                  className={`h-3 w-3 ${trend < 0 ? "rotate-180" : ""}`}
                />
                {trend > 0 ? "+" : ""}
                {Math.round(trend)}
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-2">
              <div className="flex sm:hidden items-center gap-2 mb-3">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground font-medium">
                  Avg: {Math.round(avg)}/100
                </span>
                {trend !== 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
                      trend > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <TrendingUp
                      className={`h-3 w-3 ${trend < 0 ? "rotate-180" : ""}`}
                    />
                    {trend > 0 ? "+" : ""}
                    {Math.round(trend)}
                  </span>
                )}
              </div>

              {sessions.slice(0, 10).map((session) => {
                const role = roles.find((r) => r.id === session.roleId);
                const Icon = role?.icon;
                const date = new Date(session.date);
                const dateStr = date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });
                const timeStr = date.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isSelected = selectedId === session.id;
                const hasSkills = session.skillBreakdown && session.skillBreakdown.length > 0;

                return (
                  <div key={session.id}>
                    <button
                      onClick={() => setSelectedId(isSelected ? null : session.id)}
                      className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors text-left ${
                        isSelected
                          ? "bg-primary/5 ring-1 ring-primary/20"
                          : "hover:bg-muted/30"
                      } ${hasSkills ? "cursor-pointer" : "cursor-default"}`}
                      disabled={!hasSkills}
                    >
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {Icon && (
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {session.roleTitle}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {dateStr} {timeStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] text-muted-foreground truncate">
                            {session.rank} · Lvl {session.peakDifficulty ?? 1}
                          </p>
                          {hasSkills && (
                            <span className="text-[9px] text-primary/60 shrink-0">
                              {isSelected ? "▲" : "▼ skills"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold font-heading shrink-0 ${getRankColor(session.rank)}`}
                      >
                        {session.score}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isSelected && hasSkills && (
                        <SkillBreakdownPanel
                          session={session}
                          onClose={() => setSelectedId(null)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {sessions.length > 10 && (
                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  Showing 10 of {sessions.length} sessions
                </p>
              )}

              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleClear}
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Clear History
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
