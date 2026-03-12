import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Trophy, Crown, Medal, User, Swords, ArrowRight, Zap,
  ChevronDown, ChevronUp, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEloRank } from "@/lib/elo";

interface ExpertChallenge {
  id: string;
  expert_name: string;
  expert_role: string;
  title: string;
  description: string | null;
  scenario_env: string;
  scenario_role: string;
  expert_score: number;
  difficulty: string;
  created_at: string;
}

interface ChallengeAttempt {
  id: string;
  challenge_id: string;
  user_id: string;
  score: number;
  beat_expert: boolean;
  created_at: string;
  // joined
  display_name?: string;
  avatar_url?: string | null;
}

function getDifficultyStyle(d: string) {
  switch (d) {
    case "beginner": return "border-primary/30 bg-primary/10 text-primary";
    case "intermediate": return "border-blue-400/30 bg-blue-400/10 text-blue-400";
    case "advanced": return "border-orange-400/30 bg-orange-400/10 text-orange-400";
    case "expert": return "border-yellow-400/30 bg-yellow-400/10 text-yellow-400";
    default: return "border-border bg-muted text-muted-foreground";
  }
}

function getRoleIcon(role: string) {
  if (role.toLowerCase().includes("director")) return "💼";
  if (role.toLowerCase().includes("manager")) return "👔";
  if (role.toLowerCase().includes("recruiter")) return "🎯";
  return "⭐";
}

function getMedalIcon(index: number) {
  if (index === 0) return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
  if (index === 1) return <Medal className="h-3.5 w-3.5 text-gray-400" />;
  if (index === 2) return <Medal className="h-3.5 w-3.5 text-amber-600" />;
  return <span className="text-[10px] text-muted-foreground font-bold">{index + 1}</span>;
}

function ChallengeCard({ challenge }: { challenge: ExpertChallenge }) {
  const [expanded, setExpanded] = useState(false);
  const [attempts, setAttempts] = useState<ChallengeAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const { user } = useAuth();

  const beatCount = attempts.filter(a => a.beat_expert).length;

  useEffect(() => {
    if (!expanded) return;
    setLoadingAttempts(true);

    const fetchAttempts = async () => {
      const { data: attemptsData } = await supabase
        .from("expert_challenge_attempts")
        .select("*")
        .eq("challenge_id", challenge.id)
        .order("score", { ascending: false })
        .limit(10);

      if (attemptsData && attemptsData.length > 0) {
        // Fetch profile names
        const userIds = [...new Set(attemptsData.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
        const enriched = attemptsData.map(a => ({
          ...a,
          display_name: profileMap.get(a.user_id)?.display_name ?? "Anonymous",
          avatar_url: profileMap.get(a.user_id)?.avatar_url ?? null,
        }));
        setAttempts(enriched);
      } else {
        setAttempts([]);
      }
      setLoadingAttempts(false);
    };

    fetchAttempts();
  }, [expanded, challenge.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated overflow-hidden"
    >
      {/* Card header */}
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          {/* Expert avatar */}
          <div className="h-11 w-11 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-xl shrink-0">
            {getRoleIcon(challenge.expert_role)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">{challenge.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-blue-400" />
              <span className="text-[11px] text-blue-400 font-semibold">{challenge.expert_name}</span>
              <span className="text-[10px] text-muted-foreground">· {challenge.expert_role}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Expert Score</p>
            <p className="text-lg font-bold font-heading text-foreground">{challenge.expert_score}</p>
          </div>
        </div>

        {challenge.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{challenge.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyStyle(challenge.difficulty)}`}>
            {challenge.difficulty}
          </span>
          {beatCount > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-400" />
              {beatCount} beat the expert
            </span>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {attempts.length} attempts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="hero" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
            <Link to={`/practice?env=${challenge.scenario_env}&role=${challenge.scenario_role}&expert_challenge=${challenge.id}&expert_score=${challenge.expert_score}`}>
              <Swords className="h-3.5 w-3.5" />
              Beat the Expert
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Leaderboard
          </Button>
        </div>
      </div>

      {/* Expandable leaderboard */}
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
                Best Responses
              </p>
              {loadingAttempts ? (
                <div className="py-4 text-center text-xs text-muted-foreground">Loading…</div>
              ) : attempts.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No attempts yet. Be the first to take this challenge!
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Expert benchmark row */}
                  <div className="grid grid-cols-[1.5rem_1fr_3.5rem] items-center py-1.5 px-2 rounded-lg bg-blue-400/5 border border-blue-400/10">
                    <Star className="h-3 w-3 text-blue-400" />
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-blue-400" />
                      <span className="text-[11px] font-bold text-blue-400">{challenge.expert_name}</span>
                      <span className="text-[9px] text-muted-foreground">(Expert)</span>
                    </div>
                    <span className="text-xs font-bold text-right text-blue-400">{challenge.expert_score}</span>
                  </div>

                  {/* Player attempts */}
                  {attempts.map((attempt, i) => {
                    const isCurrentUser = attempt.user_id === user?.id;
                    return (
                      <div
                        key={attempt.id}
                        className={`grid grid-cols-[1.5rem_1fr_3.5rem] items-center py-1.5 px-2 rounded-lg ${
                          isCurrentUser ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {getMedalIcon(i)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                            {attempt.avatar_url ? (
                              <img src={attempt.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                              <User className="h-2.5 w-2.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                            {attempt.display_name}
                            {isCurrentUser && <span className="text-[9px] text-muted-foreground ml-1">(you)</span>}
                          </span>
                          {attempt.beat_expert && (
                            <span className="text-[8px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full border border-yellow-400/20">
                              BEAT EXPERT
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold text-right ${
                          attempt.beat_expert ? "text-primary" : "text-foreground"
                        }`}>
                          {attempt.score}
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

export default function ExpertChallenges() {
  const [challenges, setChallenges] = useState<ExpertChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchChallenges = async () => {
      const { data } = await supabase
        .from("expert_challenges")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setChallenges((data as ExpertChallenge[]) ?? []);
      setLoading(false);
    };
    fetchChallenges();
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
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Swords className="h-7 w-7 text-primary" />
              Expert Challenges
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Verified experts set the benchmark. Can you beat their score?
            </p>
          </div>

          {/* How it works */}
          <div className="card-elevated p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { step: "1", label: "Pick a challenge", desc: "Choose an expert's scenario" },
                { step: "2", label: "Complete it", desc: "Practice the same interview" },
                { step: "3", label: "Beat the expert", desc: "Score higher to earn the badge" },
              ].map(s => (
                <div key={s.step}>
                  <p className="text-[10px] font-mono text-primary">{s.step}</p>
                  <p className="text-xs font-bold text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Challenges list */}
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading challenges…</div>
          ) : challenges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-elevated p-8 text-center space-y-3"
            >
              <Swords className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No expert challenges yet</p>
              <p className="text-xs text-muted-foreground">
                Verified evaluators will post challenges here soon. Check back later!
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/practice">Practice in the meantime</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge, i) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <ChallengeCard challenge={challenge} />
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
