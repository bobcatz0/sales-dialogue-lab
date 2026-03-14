import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardCheck, User, Mail, ArrowRight, CheckCircle2, Loader2, BarChart3, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SALES_CERTIFICATION_TRACK, getCertificationLevel, calculateFinalScore } from "@/components/certification/certificationData";
import type { StageScore } from "@/components/certification/certificationData";

type Phase = "intro" | "stage" | "results";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  invite_code: string;
}

export default function AssessmentPage() {
  const { code } = useParams<{ code: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageScores, setStageScores] = useState<StageScore[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const stages = SALES_CERTIFICATION_TRACK.stages;

  useEffect(() => {
    async function load() {
      if (!code) { setNotFound(true); setLoading(false); return; }
      const { data } = await supabase
        .from("assessments")
        .select("id, title, description, invite_code")
        .eq("invite_code", code)
        .eq("status", "active")
        .maybeSingle();
      if (!data) setNotFound(true);
      else setAssessment(data);
      setLoading(false);
    }
    load();
  }, [code]);

  const handleStart = () => {
    if (!candidateName.trim() || !candidateEmail.trim()) return;
    setPhase("stage");
  };

  // Simulate completing a stage (in production, this would link to the actual practice session)
  const handleCompleteStage = () => {
    const score = Math.floor(Math.random() * 30) + 60; // simulated 60-90
    const newScores = [...stageScores, {
      stageId: stages[currentStageIdx].id,
      score,
      completedAt: new Date().toISOString(),
    }];
    setStageScores(newScores);

    if (currentStageIdx < stages.length - 1) {
      setCurrentStageIdx(currentStageIdx + 1);
    } else {
      setPhase("results");
      submitResults(newScores);
    }
  };

  const submitResults = async (scores: StageScore[]) => {
    if (!assessment) return;
    setSubmitting(true);
    const finalScore = calculateFinalScore(stages, scores);

    // Calculate percentile from existing scorecards
    const { count: below } = await supabase
      .from("scorecards")
      .select("id", { count: "exact", head: true })
      .lt("score", finalScore);
    const { count: total } = await supabase
      .from("scorecards")
      .select("id", { count: "exact", head: true });
    const percentile = total && total > 0 ? Math.round(((below ?? 0) / total) * 100) : 50;

    const skillBreakdown = scores.map((s) => {
      const stage = stages.find((st) => st.id === s.stageId);
      return { name: stage?.title ?? s.stageId, score: s.score };
    });

    await (supabase.from("assessment_submissions") as any).insert({
      assessment_id: assessment.id,
      candidate_name: candidateName.trim(),
      candidate_email: candidateEmail.trim(),
      score: finalScore,
      percentile,
      skill_breakdown: skillBreakdown,
      stage_scores: scores,
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Assessment Not Found</h1>
          <p className="text-sm text-muted-foreground">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const finalScore = calculateFinalScore(stages, stageScores);
    const tier = getCertificationLevel(finalScore);
    const { count: below } = { count: null }; // already submitted
    const topPct = 100 - (stageScores.length > 0 ? Math.round(finalScore * 0.9) : 50);

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-8 text-center space-y-6"
          >
            <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full" />

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Assessment Complete</p>
              <h1 className="text-2xl font-bold font-heading text-foreground">{assessment.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{candidateName}</p>
            </div>

            {/* Score */}
            <div className="py-4">
              <p className="text-6xl font-bold font-heading text-primary">{finalScore}</p>
              <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
            </div>

            {/* Tier badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{tier.icon}</span>
              <span className={`text-sm font-bold ${tier.color}`}>{tier.name}</span>
            </div>

            {/* Stage scores */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Stage Breakdown</h3>
              </div>
              {stageScores.map((ss) => {
                const stage = stages.find((s) => s.id === ss.stageId);
                return (
                  <div key={ss.stageId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{stage?.title}</p>
                      <p className="text-[10px] text-muted-foreground">Weight: {stage?.weight}%</p>
                    </div>
                    <span className={`text-lg font-bold font-heading ${
                      ss.score >= 80 ? "text-primary" : ss.score >= 60 ? "text-foreground" : "text-destructive"
                    }`}>{ss.score}</span>
                  </div>
                );
              })}
            </div>

            {submitting && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting results...
              </div>
            )}
            {submitted && (
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Results submitted to recruiter
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "stage") {
    const stage = stages[currentStageIdx];
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-12">
          <motion.div
            key={currentStageIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-elevated p-6 space-y-5"
          >
            {/* Progress */}
            <div className="flex items-center gap-2">
              {stages.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${
                  i < currentStageIdx ? "bg-primary" :
                  i === currentStageIdx ? "bg-primary/50" :
                  "bg-muted"
                }`} />
              ))}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
                Stage {currentStageIdx + 1} of {stages.length}
              </p>
              <h2 className="text-xl font-bold font-heading text-foreground mt-1">{stage.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{stage.subtitle}</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{stage.description}</p>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Evaluation Criteria</p>
              {stage.evaluationCriteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  {c}
                </div>
              ))}
            </div>

            {/* Completed stages */}
            {stageScores.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {stageScores.map((ss) => {
                  const st = stages.find((s) => s.id === ss.stageId);
                  return (
                    <span key={ss.stageId} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      {st?.title}: {ss.score}
                    </span>
                  );
                })}
              </div>
            )}

            <Button onClick={handleCompleteStage} className="w-full gap-2">
              {currentStageIdx < stages.length - 1 ? (
                <>Complete Stage <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Complete & Get Results <Trophy className="h-4 w-4" /></>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Duration: {stage.duration} · Framework: {stage.framework}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Intro phase
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-foreground">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-sm text-muted-foreground">{assessment.description}</p>
            )}
          </div>

          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">What to expect</p>
            <div className="space-y-1.5">
              {stages.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-foreground">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {s.title}
                  <span className="text-muted-foreground ml-auto">{s.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Your full name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Your email address"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={!candidateName.trim() || !candidateEmail.trim()}
            className="w-full gap-2"
            size="lg"
          >
            Begin Assessment
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            ~20 minutes · 4 stages · Results shared with recruiter
          </p>
        </motion.div>
      </div>
    </div>
  );
}
