import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Trophy, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { getTodayChallenge } from "@/components/practice/dailyChallenge";
import { supabase } from "@/integrations/supabase/client";

const OBJECTIONS = [
  "We're happy with our current vendor.",
  "We don't have budget for this right now.",
  "Can you just send me an email?",
  "I'm not the right person to talk to.",
  "We tried something similar and it didn't work.",
];

function pickObjection(date: string): string {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) | 0;
  return OBJECTIONS[Math.abs(h) % OBJECTIONS.length];
}

type Phase = "ready" | "writing" | "submitting" | "result";

interface ScoreResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export default function DailyChallenge() {
  const { challenge } = getTodayChallenge();
  const today = new Date().toISOString().slice(0, 10);
  const objection = pickObjection(today);

  const [phase, setPhase] = useState<Phase>("ready");
  const [response, setResponse] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startChallenge = () => {
    setPhase("writing");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const submitResponse = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("submitting");

    try {
      const { data } = await supabase.functions.invoke("battle-score", {
        body: {
          prompt: objection,
          response: response,
          context: "cold-call objection handling",
        },
      });

      if (data?.score != null) {
        setResult({
          score: data.score,
          feedback: data.feedback || "Good effort!",
          strengths: data.strengths || [],
          improvements: data.improvements || [],
        });
      } else {
        // Fallback scoring
        const words = response.trim().split(/\s+/).length;
        const baseScore = Math.min(85, 40 + words * 2);
        setResult({
          score: baseScore,
          feedback: "Your response has been evaluated.",
          strengths: ["Attempted a response"],
          improvements: ["Add more specificity", "Use a framework like Feel-Felt-Found"],
        });
      }
    } catch {
      const words = response.trim().split(/\s+/).length;
      const baseScore = Math.min(85, 40 + words * 2);
      setResult({
        score: baseScore,
        feedback: "Your response has been evaluated.",
        strengths: ["Attempted a response"],
        improvements: ["Add more specificity"],
      });
    }

    setPhase("result");
  };

  const retry = () => {
    setResponse("");
    setResult(null);
    setPhase("ready");
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-[11px] font-semibold text-primary">
            <Zap className="h-3 w-3" />
            Daily Challenge · {today}
          </span>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5"
        >
          <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

          <div className="p-6 md:p-8 space-y-6">
            {/* Objection prompt — always visible */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Prospect says:
              </p>
              <div className="rounded-xl bg-muted/30 border border-border p-4">
                <p className="text-lg font-heading font-bold text-foreground leading-snug italic">
                  "{objection}"
                </p>
              </div>
            </div>

            {/* ═══ READY PHASE ═══ */}
            {phase === "ready" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> ~60 seconds
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-primary" /> +25 bonus ELO
                  </span>
                </div>
                <Button variant="hero" className="w-full h-12 text-base gap-2" onClick={startChallenge}>
                  Start Challenge
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-[10px] text-muted-foreground/50 text-center">
                  AI-scored in seconds · No signup required
                </p>
              </motion.div>
            )}

            {/* ═══ WRITING PHASE ═══ */}
            {phase === "writing" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Your response:</p>
                  <span className="text-sm font-heading font-bold text-primary tabular-nums">
                    {formatTime(elapsed)}
                  </span>
                </div>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response to the prospect…"
                  className="min-h-[120px] resize-none text-base"
                  autoFocus
                />
                <Button
                  variant="hero"
                  className="w-full h-12 text-base gap-2"
                  onClick={submitResponse}
                  disabled={response.trim().length < 10}
                >
                  Submit Response
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* ═══ SUBMITTING PHASE ═══ */}
            {phase === "submitting" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Scoring your response…</p>
              </div>
            )}

            {/* ═══ RESULT PHASE ═══ */}
            {phase === "result" && result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Score */}
                <div className="text-center space-y-1">
                  <p className="text-5xl font-heading font-bold text-primary tabular-nums">
                    {result.score}
                  </p>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                </div>

                {/* Feedback */}
                <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-3">
                  <p className="text-sm text-foreground">{result.feedback}</p>
                  {result.strengths.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                        Strengths
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        {result.strengths.map((s, i) => (
                          <li key={i}>✓ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.improvements.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Improve
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        {result.improvements.map((s, i) => (
                          <li key={i}>→ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button variant="hero" className="w-full h-11 text-base gap-2" onClick={retry}>
                    <RotateCcw className="h-4 w-4" />
                    Retry & Beat Your Score
                  </Button>
                  <Button variant="outline" className="w-full h-10 text-sm gap-2" asChild>
                    <Link to="/leaderboard">
                      <Trophy className="h-3.5 w-3.5" />
                      View Leaderboard
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground" asChild>
                    <Link to="/practice">
                      Explore more scenarios →
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
