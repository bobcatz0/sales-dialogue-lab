import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Swords, Trophy, Crown, Medal, User, ArrowRight, Flame,
  ChevronDown, ChevronUp, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEloRank } from "@/lib/elo";

interface ProBenchmark {
  id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  scenario_title: string;
  rank: string;
  elo: number | null;
  created_at: string;
  // parsed from scorecard for linking
  framework_id: string | null;
}

interface ProAttempt {
  id: string;
  user_id: string;
  user_score: number;
  beat_pro: boolean;
  bonus_elo: number;
  created_at: string;
  display_name?: string;
  avatar_url?: string | null;
}

const BONUS_ELO = 15;

function getMedalIcon(index: number) {
  if (index === 0) return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
  if (index === 1) return <Medal className="h-3.5 w-3.5 text-gray-400" />;
  if (index === 2) return <Medal className="h-3.5 w-3.5 text-amber-600" />;
  return <span className="text-[10px] text-muted-foreground font-bold">{index + 1}</span>;
}

function scenarioToParams(title: string): { env: string; role: string } {
  const t = title.toLowerCase();
  if (t.includes("cold call")) return { env: "cold-call", role: "b2b-prospect" };
  if (t.includes("enterprise")) return { env: "enterprise", role: "decision-maker" };
  if (t.includes("final round")) return { env: "final-round", role: "hiring-manager" };
  if (t.includes("discovery")) return { env: "discovery", role: "prospect" };
  return { env: "interview", role: "hiring-manager" };
}

function ProCard({ benchmark }: { benchmark: ProBenchmark }) {
  const [expanded, setExpanded] = useState(false);
  const [attempts, setAttempts] = useState<ProAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const beatCount = attempts.filter(a => a.beat_pro).length;
  const params = scenarioToParams(benchmark.scenario_title);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    const fetch = async () => {
      const { data } = await supabase
        .from("pro_challenge_attempts")
        .select("*")
        .eq("scorecard_id", benchmark.id)
        .order("user_score", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((a: any) => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
        setAttempts(data.map((a: any) => ({
          ...a,
          display_name: profileMap.get(a.user_id)?.display_name ?? "Anonymous",
          avatar_url: profileMap.get(a.user_id)?.avatar_url ?? null,
        })));
      } else {
        setAttempts([]);
      }
      setLoading(false);
    };
    fetch();
  }, [expanded, benchmark.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated overflow-hidden"
    >
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {benchmark.avatar_url ? (
              <img src={benchmark.avatar_url} alt="" className="h-11 w-11 object-cover" />
            ) : (
              <Flame className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{benchmark.scenario_title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Target className="h-3 w-3 text-primary" />
              <span className="text-[11px] text-primary font-semibold">{benchmark.display_name}</span>
              <span className="text-[10px] text-muted-foreground">· {benchmark.rank}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Pro Score</p>
            <p className="text-lg font-bold font-heading text-foreground">{benchmark.score}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {beatCount > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-400" />
              {beatCount} beat the pro
            </span>
          )}
          <Badge variant="outline" className="text-[9px]">
            +{BONUS_ELO} bonus ELO if you win
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="hero" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
            <Link to={`/practice?env=${params.env}&role=${params.role}&pro_challenge=${benchmark.id}&pro_score=${benchmark.score}`}>
              <Swords className="h-3.5 w-3.5" />
              Beat the Pro
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Results
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Challenger Results
              </p>

              {/* Pro benchmark row */}
              <div className="grid grid-cols-[1.5rem_1fr_3.5rem] items-center py-1.5 px-2 rounded-lg bg-primary/5 border border-primary/10 mb-1">
                <Target className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold text-primary">{benchmark.display_name} (Pro)</span>
                <span className="text-xs font-bold text-right text-primary">{benchmark.score}</span>
              </div>

              {loading ? (
                <div className="py-4 text-center text-xs text-muted-foreground">Loading…</div>
              ) : attempts.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No challengers yet. Be the first!
                </div>
              ) : (
                <div className="space-y-1">
                  {attempts.map((a, i) => {
                    const isMe = a.user_id === user?.id;
                    return (
                      <div
                        key={a.id}
                        className={`grid grid-cols-[1.5rem_1fr_3.5rem] items-center py-1.5 px-2 rounded-lg ${isMe ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-center justify-center">{getMedalIcon(i)}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                            {a.avatar_url ? (
                              <img src={a.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                              <User className="h-2.5 w-2.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                            {a.display_name}
                            {isMe && <span className="text-[9px] text-muted-foreground ml-1">(you)</span>}
                          </span>
                          {a.beat_pro && (
                            <span className="text-[8px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full border border-yellow-400/20">
                              BEAT PRO
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold text-right ${a.beat_pro ? "text-primary" : "text-foreground"}`}>
                          {a.user_score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BeatThePro() {
  const [benchmarks, setBenchmarks] = useState<ProBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBenchmarks = async () => {
      // Get top scorecards (score 85+) as pro benchmarks — unique per scenario
      const { data } = await supabase
        .from("scorecards")
        .select("id, display_name, avatar_url, score, scenario_title, rank, elo, created_at, framework_id")
        .gte("score", 85)
        .order("score", { ascending: false })
        .limit(50);

      if (data) {
        // Deduplicate by scenario_title — keep top score per scenario
        const seen = new Map<string, ProBenchmark>();
        for (const s of data) {
          if (!seen.has(s.scenario_title)) {
            seen.set(s.scenario_title, s as ProBenchmark);
          }
        }
        setBenchmarks(Array.from(seen.values()).slice(0, 12));
      }
      setLoading(false);
    };
    fetchBenchmarks();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Swords className="h-7 w-7 text-primary" />
              Beat the Pro
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Top players set the benchmark. Can you outperform their score on the same scenario?
            </p>
          </div>

          <div className="card-elevated p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { step: "1", label: "Pick a challenge", desc: "Choose a pro's scenario" },
                { step: "2", label: "Complete it", desc: "Answer the same prompts" },
                { step: "3", label: "Beat the pro", desc: `Score higher = +${BONUS_ELO} bonus ELO` },
              ].map(s => (
                <div key={s.step}>
                  <p className="text-[10px] font-mono text-primary">{s.step}</p>
                  <p className="text-xs font-bold text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading challenges…</div>
          ) : benchmarks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-elevated p-8 text-center space-y-3"
            >
              <Swords className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No pro benchmarks yet</p>
              <p className="text-xs text-muted-foreground">
                Complete sessions with high scores to become a pro benchmark!
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/practice">Practice now</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {benchmarks.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProCard benchmark={b} />
                </motion.div>
              ))}
            </div>
          )}

          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Button variant="hero" size="sm" asChild>
                <Link to="/login" className="gap-2">
                  Sign in to compete
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
