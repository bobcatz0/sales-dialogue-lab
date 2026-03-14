import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, TrendingUp, AlertTriangle } from "lucide-react";
import { ShareResultCard } from "@/components/practice/ShareResultCard";
import { supabase } from "@/integrations/supabase/client";
import { getEloRank } from "@/lib/elo";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import Navbar from "@/components/landing/Navbar";

interface RubricScore {
  criterion: string;
  weight: string;
  score: number;
  note: string;
}

interface ScorecardData {
  id: string;
  score: number;
  rank: string;
  percentile: number;
  scenario_title: string;
  framework_id: string | null;
  rubric_scores: RubricScore[];
  strengths: string[];
  improvements: string[];
  best_moment: string | null;
  elo: number | null;
  elo_delta: number | null;
  alias: string | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

const FRAMEWORK_LABELS: Record<string, string> = {
  star: "STAR Method",
  bant: "BANT Framework",
  meddic: "MEDDIC Framework",
  spin: "SPIN Selling",
};

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

export default function ScorecardPage() {
  const { id } = useParams<{ id: string }>();
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("scorecards")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setScorecard({
          ...data,
          rubric_scores: (data.rubric_scores as unknown as RubricScore[]) || [],
          strengths: (data.strengths as unknown as string[]) || [],
          improvements: (data.improvements as unknown as string[]) || [],
        });
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !scorecard) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32 gap-4">
          <p className="text-lg font-semibold text-foreground">Scorecard not found</p>
          <p className="text-sm text-muted-foreground">This scorecard may have been removed or the link is invalid.</p>
          <Link to="/scenarios">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Try a scenario
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const topPercent = Math.max(1, 100 - scorecard.percentile);
  const frameworkLabel = scorecard.framework_id && scorecard.framework_id !== "none"
    ? FRAMEWORK_LABELS[scorecard.framework_id] || scorecard.framework_id.toUpperCase()
    : null;
  const rubric = scorecard.rubric_scores;
  const weakestSkill = rubric.length > 0
    ? rubric.reduce((min, r) => r.score < min.score ? r : min, rubric[0])
    : null;
  const strongestSkill = rubric.length > 0
    ? rubric.reduce((max, r) => r.score > max.score ? r : max, rubric[0])
    : null;
  const rankTier = scorecard.elo != null ? getEloRank(scorecard.elo) : null;
  const formattedDate = new Date(scorecard.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    SalesCalls.io Scorecard
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
                </div>
                <UserAvatar
                  avatarUrl={scorecard.avatar_url}
                  displayName={scorecard.display_name}
                  elo={scorecard.elo ?? 1000}
                  size="md"
                  showRankBadge={false}
                  showName
                />
              </div>

              {/* Scenario */}
              <div>
                <p className="text-lg font-bold text-foreground">{scorecard.scenario_title}</p>
                {frameworkLabel && (
                  <span className="inline-block mt-1.5 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5">
                    {frameworkLabel}
                  </span>
                )}
              </div>

              {/* Score + Percentile */}
              <div className="flex items-baseline gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold font-heading text-foreground">{scorecard.score}</span>
                  <span className="text-lg text-muted-foreground">/ 100</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-primary block">
                    Top {topPercent}%
                  </span>
                  <span className={`text-xs font-bold ${getRankColor(scorecard.rank)}`}>
                    {scorecard.rank}
                  </span>
                </div>
              </div>

              {/* ELO */}
              {scorecard.elo != null && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold font-heading text-foreground">{scorecard.elo}</span>
                    <span className="text-xs text-muted-foreground">ELO</span>
                    {scorecard.elo_delta != null && (
                      <span className={`text-xs font-bold ${scorecard.elo_delta >= 0 ? "text-primary" : "text-destructive"}`}>
                        {scorecard.elo_delta >= 0 ? "+" : ""}{scorecard.elo_delta}
                      </span>
                    )}
                  </div>
                  {rankTier && (
                    <span className={`text-[10px] font-semibold bg-primary/10 rounded-full px-2.5 py-0.5 ${getRankColor(rankTier)}`}>
                      {rankTier}
                    </span>
                  )}
                </div>
              )}

              {/* Rubric Breakdown */}
              {rubric.length > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Breakdown
                  </p>
                  {rubric.map((r, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{r.criterion}</span>
                        <span className="text-xs font-medium text-foreground tabular-nums">{r.score}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${r.score}%` }}
                          transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}
                          className={`h-full rounded-full ${
                            weakestSkill && r.criterion === weakestSkill.criterion
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                        />
                      </div>
                      {r.note && (
                        <p className="text-[10px] text-muted-foreground italic">{r.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Strongest Skill */}
              {strongestSkill && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="h-3 w-3 text-primary" />
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                      Strongest Skill
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{strongestSkill.criterion}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Score: {strongestSkill.score}/100{strongestSkill.note ? ` — ${strongestSkill.note}` : ""}
                  </p>
                </div>
              )}

              {/* Weakest Skill */}
              {weakestSkill && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider">
                      Focus Area
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{weakestSkill.criterion}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Score: {weakestSkill.score}/100{weakestSkill.note ? ` — ${weakestSkill.note}` : ""}
                  </p>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scorecard.strengths.length > 0 && (
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1.5">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Strengths</p>
                    {scorecard.strengths.map((s, i) => (
                      <p key={i} className="text-[11px] text-foreground">✓ {s}</p>
                    ))}
                  </div>
                )}
                {scorecard.improvements.length > 0 && (
                  <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">To Improve</p>
                    {scorecard.improvements.map((s, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">→ {s}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Best Moment */}
              {scorecard.best_moment && (
                <div className="rounded-lg bg-muted/30 border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    <Trophy className="h-3 w-3 inline mr-1" />Best Moment
                  </p>
                  <p className="text-xs text-foreground italic">"{scorecard.best_moment}"</p>
                </div>
              )}

              {scorecard.alias && (
                <p className="text-xs text-muted-foreground">— {scorecard.alias}</p>
              )}

              <p className="text-[9px] text-muted-foreground/50">
                salescalls.io — Practice real sales scenarios
              </p>
            </div>
          </div>

          {/* Share */}
          <ShareResultCard
            scenarioTitle={scorecard.scenario_title}
            score={scorecard.score}
            rank={scorecard.rank}
            percentile={scorecard.percentile}
            eloDelta={scorecard.elo_delta}
            elo={scorecard.elo}
            scorecardUrl={`${window.location.origin}/scorecard/${scorecard.id}`}
          />

          {/* CTA */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Think you can beat this score?</p>
            <Link to="/scenarios">
              <Button className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Try a Scenario
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
