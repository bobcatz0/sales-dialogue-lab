import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, CheckCircle2, Circle, Zap, ArrowRight, RotateCcw,
  Shield, Clock, Target, ChevronDown, ChevronUp, Trophy, Crown, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  SALES_CERTIFICATION_TRACK,
  getCertificationLevel,
  calculateFinalScore,
  CERTIFICATION_TIERS,
  type CertificationAttempt,
} from "@/components/certification/certificationData";
import {
  loadCertificationAttempt,
  startCertificationAttempt,
  clearCertificationAttempt,
} from "@/components/certification/certificationStorage";

// ── Certificate Display ──

function CertificateCard({ level, score, displayName, date }: {
  level: string;
  score: number;
  displayName: string;
  date: string;
}) {
  const tier = CERTIFICATION_TIERS.find((t) => t.name === level) ?? CERTIFICATION_TIERS[0];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-card p-8 text-center max-w-lg mx-auto"
    >
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/20 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary/20 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary/20 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/20 rounded-br-2xl" />

      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative space-y-4">
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">
          Certificate of Achievement
        </p>

        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <span className="text-5xl">{tier.icon}</span>
        </motion.div>

        <div>
          <h2 className={`font-heading text-2xl font-bold ${tier.color}`}>{level}</h2>
          <p className="text-sm text-muted-foreground mt-1">Awarded to</p>
          <p className="text-lg font-bold text-foreground">{displayName}</p>
        </div>

        <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-5 py-2">
          <Trophy className={`h-4 w-4 ${tier.color}`} />
          <span className="text-2xl font-bold font-heading text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Sales Certification Assessment • {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </motion.div>
  );
}

// ── Stage Card ──

function StageCard({ stage, index, score, isCurrent, isLocked, onStart }: {
  stage: typeof SALES_CERTIFICATION_TRACK.stages[0];
  index: number;
  score: number | null;
  isCurrent: boolean;
  isLocked: boolean;
  onStart: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isComplete = score !== null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative rounded-xl border overflow-hidden transition-all ${
        isCurrent
          ? "border-primary/40 bg-card shadow-[0_0_25px_-8px_hsl(var(--primary)/0.15)]"
          : isComplete
          ? "border-green-500/20 bg-card"
          : "border-border bg-card opacity-60"
      }`}
    >
      {/* Weight indicator */}
      <div className={`h-0.5 ${isComplete ? "bg-green-500" : isCurrent ? "bg-primary" : "bg-muted"}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            isComplete ? "bg-green-500/15" : isCurrent ? "bg-primary/15" : "bg-muted/40"
          }`}>
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : isCurrent ? (
              <Zap className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/30" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-sm font-bold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                  Stage {index + 1}: {stage.title}
                </h4>
                <p className="text-[11px] text-muted-foreground">{stage.subtitle}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[9px] h-[16px] px-1.5">
                  {stage.weight}% weight
                </Badge>
                {score !== null && (
                  <span className={`text-sm font-bold font-heading ${
                    score >= 85 ? "text-green-400" : score >= 65 ? "text-amber-400" : "text-destructive"
                  }`}>
                    {score}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{stage.description}</p>

            {/* Expand criteria */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[10px] text-primary font-medium mt-2 hover:underline"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide criteria" : "Evaluation criteria"}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stage.evaluationCriteria.map((c) => (
                      <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 border border-border/50 text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{stage.duration}</span>
              <span className="flex items-center gap-1"><Target className="h-3 w-3" />{stage.framework}</span>
            </div>

            {/* CTA */}
            {isCurrent && !isComplete && (
              <Button
                size="sm"
                className="mt-3 h-8 text-xs font-bold gap-1.5"
                onClick={onStart}
              >
                <Zap className="h-3 w-3" />
                Start Stage {index + 1}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Certification Tiers Legend ──

function TiersLegend() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Certification Levels</p>
      <div className="space-y-1.5">
        {[...CERTIFICATION_TIERS].reverse().map((tier) => (
          <div key={tier.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
            <span className="text-sm">{tier.icon}</span>
            <span className={`text-xs font-semibold flex-1 ${tier.color}`}>{tier.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{tier.minScore}+</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──

export default function Certification() {
  const { user, profile } = useAuth();
  const [attempt, setAttempt] = useState<CertificationAttempt | null>(null);
  const [existingCert, setExistingCert] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const track = SALES_CERTIFICATION_TRACK;

  useEffect(() => {
    if (!user?.id) return;

    // Load in-progress attempt
    const saved = loadCertificationAttempt(user.id);
    if (saved) setAttempt(saved);

    // Load existing certification
    const loadExisting = async () => {
      const { data } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("track_id", track.id)
        .maybeSingle();
      if (data) setExistingCert(data);
    };
    loadExisting();
  }, [user?.id, track.id]);

  const handleStart = () => {
    if (!user?.id) return;
    const newAttempt = startCertificationAttempt(user.id, track.id);
    setAttempt(newAttempt);
  };

  const handleReset = () => {
    clearCertificationAttempt();
    setAttempt(null);
  };

  const handleStartStage = (stageIndex: number) => {
    const stage = track.stages[stageIndex];
    window.location.href = `/practice?env=${stage.env}&role=${stage.role}&cert=${track.id}&certStage=${stageIndex}`;
  };

  const completedStages = attempt?.stageScores.length ?? 0;
  const progressPct = (completedStages / track.stages.length) * 100;
  const isComplete = attempt?.status === "completed";

  // Calculate final results
  let finalScore = 0;
  let certLevel = CERTIFICATION_TIERS[0];
  if (isComplete && attempt) {
    finalScore = calculateFinalScore(track.stages, attempt.stageScores);
    certLevel = getCertificationLevel(finalScore);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-5">
            <Award className="h-3.5 w-3.5" />
            Interview Certification
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Sales{" "}
            <span className="text-gradient">Certification</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {track.description}
          </p>
        </motion.div>

        {/* Completed certification result */}
        {isComplete && attempt && !showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10"
          >
            <CertificateCard
              level={certLevel.name}
              score={finalScore}
              displayName={profile?.display_name ?? "Anonymous"}
              date={attempt.completedAt ?? new Date().toISOString()}
            />

            {/* Stage breakdown */}
            <div className="max-w-lg mx-auto mt-6 space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Stage Breakdown</p>
              {track.stages.map((stage, i) => {
                const s = attempt.stageScores.find((ss) => ss.stageId === stage.id);
                return (
                  <div key={stage.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-[10px] text-muted-foreground w-6">S{i + 1}</span>
                    <span className="text-xs text-foreground flex-1">{stage.title}</span>
                    <Badge variant="outline" className="text-[9px] h-[16px]">{stage.weight}%</Badge>
                    <span className={`text-xs font-bold ${
                      (s?.score ?? 0) >= 85 ? "text-green-400" : (s?.score ?? 0) >= 65 ? "text-amber-400" : "text-destructive"
                    }`}>
                      {s?.score ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Retake Certification
              </Button>
            </div>
          </motion.div>
        )}

        {/* Existing certification badge */}
        {existingCert && !attempt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto mb-10"
          >
            <CertificateCard
              level={existingCert.certification_level}
              score={existingCert.final_score}
              displayName={existingCert.display_name}
              date={existingCert.created_at}
            />
            <div className="flex justify-center mt-6">
              <Button variant="outline" size="sm" onClick={handleStart}>
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Retake Certification
              </Button>
            </div>
          </motion.div>
        )}

        {/* Active attempt or start */}
        {!isComplete && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Stages */}
            <div className="lg:col-span-2 space-y-3">
              {attempt && (
                <div className="mb-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{completedStages}/{track.stages.length} stages completed</span>
                    <span className="font-mono">{Math.round(progressPct)}%</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
              )}

              {!attempt && !existingCert && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center mb-6"
                >
                  <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-heading text-lg font-bold text-foreground mb-1">Ready to get certified?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete all 4 stages to earn your Sales Certification. Your weighted scores determine your certification level.
                  </p>
                  <Button onClick={handleStart} className="gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Begin Certification
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {attempt && track.stages.map((stage, i) => {
                const score = attempt.stageScores.find((s) => s.stageId === stage.id)?.score ?? null;
                const isCurrent = i === attempt.currentStageIndex && !isComplete;
                const isLocked = i > attempt.currentStageIndex;

                return (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    index={i}
                    score={score}
                    isCurrent={isCurrent}
                    isLocked={isLocked}
                    onStart={() => handleStartStage(i)}
                  />
                );
              })}

              {attempt && (
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleReset}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restart
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <TiersLegend />

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">How It Works</p>
                <div className="space-y-2">
                  {[
                    { icon: Target, text: "Complete all 4 stages in order" },
                    { icon: Shield, text: "Each stage tests a different sales skill" },
                    { icon: Award, text: "Weighted scores determine your certification" },
                    { icon: Crown, text: "Score 85+ for Rainmaker certification" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[11px] text-muted-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
