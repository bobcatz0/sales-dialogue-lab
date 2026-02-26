import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionRecord } from "./types";
import { roles } from "./roleData";
import { clearHistory } from "./sessionStorage";

function getRankColor(rank: string) {
  switch (rank) {
    case "Expert":
    case "Skilled":
      return "text-primary";
    case "Competent":
      return "text-accent-foreground";
    default:
      return "text-muted-foreground";
  }
}

export function SessionHistory({
  sessions,
  onClear,
}: {
  sessions: SessionRecord[];
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

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

                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors"
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
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {session.rank}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-bold font-heading shrink-0 ${getRankColor(session.rank)}`}
                    >
                      {session.score}
                    </div>
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
