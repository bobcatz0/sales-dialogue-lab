import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Copy, Check, ClipboardCheck, Users, BarChart3, Trophy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCertificationLevel } from "@/components/certification/certificationData";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  invite_code: string;
  status: string;
  created_at: string;
}

interface Submission {
  id: string;
  candidate_name: string;
  candidate_email: string;
  score: number;
  percentile: number;
  skill_breakdown: { name: string; score: number }[];
  completed_at: string;
}

function CreateAssessmentForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await (supabase.from("assessments") as any).insert({
      created_by: user.id,
      title: title.trim(),
      description: description.trim() || null,
    });

    if (error) {
      toast.error("Failed to create assessment. Make sure you have manager permissions.");
    } else {
      toast.success("Assessment created!");
      setTitle("");
      setDescription("");
      setOpen(false);
      onCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Assessment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Candidate Assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input
            placeholder="Assessment title (e.g., SDR Assessment Q1)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Assessment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentCard({ assessment, onSelect }: { assessment: Assessment; onSelect: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/assess/${assessment.invite_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 space-y-3 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{assessment.title}</h3>
          {assessment.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{assessment.description}</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          assessment.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          {assessment.status}
        </span>
      </div>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <code className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded flex-1 truncate">
          {link}
        </code>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0 shrink-0">
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </motion.div>
  );
}

function SubmissionRow({ sub }: { sub: Submission }) {
  const tier = getCertificationLevel(sub.score);
  const topPct = 100 - sub.percentile;
  const skills = sub.skill_breakdown || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">{sub.candidate_name}</p>
          <p className="text-[10px] text-muted-foreground">{sub.candidate_email}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-heading text-foreground">{sub.score}</p>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[10px]">{tier.icon}</span>
            <span className={`text-[10px] font-bold ${tier.color}`}>{tier.name}</span>
          </div>
        </div>
      </div>

      {/* Percentile */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={`text-xs font-bold ${topPct <= 10 ? "text-primary" : "text-foreground"}`}>
          Top {topPct}%
        </span>
        <span className="text-[10px] text-muted-foreground">of all players</span>
      </div>

      {/* Skill bars */}
      {skills.length > 0 && (
        <div className="space-y-2">
          {skills.map((sk) => (
            <div key={sk.name} className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{sk.name}</span>
                <span className="font-bold text-foreground">{sk.score}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    sk.score >= 80 ? "bg-primary" : sk.score >= 60 ? "bg-primary/60" : "bg-destructive/60"
                  }`}
                  style={{ width: `${sk.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Completed {new Date(sub.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </motion.div>
  );
}

export default function RecruiterDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(false);

  const fetchAssessments = async () => {
    const { data } = await (supabase
      .from("assessments") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAssessments(data as Assessment[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAssessments();
  }, [user]);

  const fetchSubmissions = async (assessmentId: string) => {
    setSubsLoading(true);
    setSelectedId(assessmentId);
    const { data } = await (supabase
      .from("assessment_submissions") as any)
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("completed_at", { ascending: false });
    if (data) setSubmissions(data as unknown as Submission[]);
    setSubsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-3">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to access assessments</h1>
          <p className="text-sm text-muted-foreground">You need a manager account to create and view candidate assessments.</p>
        </div>
      </div>
    );
  }

  const selected = assessments.find((a) => a.id === selectedId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Recruiter Assessments
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create simulation links for candidates and review their results.</p>
          </div>
          <CreateAssessmentForm onCreated={fetchAssessments} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Assessment list */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Assessments</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-border">
                <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No assessments yet. Create one to get started.</p>
              </div>
            ) : (
              assessments.map((a) => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  onSelect={() => fetchSubmissions(a.id)}
                />
              ))
            )}
          </div>

          {/* Right: Submissions */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selected ? `Results: ${selected.title}` : "Select an assessment"}
            </h2>
            {!selectedId ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-border">
                <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click an assessment to view candidate results.</p>
              </div>
            ) : subsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-border">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No candidates have completed this assessment yet.</p>
              </div>
            ) : (
              submissions.map((s) => <SubmissionRow key={s.id} sub={s} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
