import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Trophy, Clock, Copy, Check, BarChart3, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ENVIRONMENTS } from "@/components/practice/environments";
import { UserAvatar } from "@/components/UserAvatar";
import { getEloRank } from "@/lib/elo";

interface TeamChallenge {
  id: string;
  title: string;
  description: string | null;
  scenario_env: string;
  scenario_role: string;
  custom_prompt: string | null;
  deadline: string;
  invite_code: string;
  created_at: string;
  status: string;
}

interface ChallengeMember {
  id: string;
  user_id: string;
  score: number | null;
  completed_at: string | null;
  joined_at: string;
  profile?: { display_name: string; avatar_url: string | null; elo: number };
}

// ─── Create Challenge Form ─────────────────────────────────────
function CreateChallengeForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [env, setEnv] = useState("cold-call");
  const [role, setRole] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !deadline) {
      toast.error("Title and deadline are required.");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase.from("team_challenges").insert({
      manager_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      scenario_env: env,
      scenario_role: role || "hiring-manager",
      custom_prompt: customPrompt.trim() || null,
      deadline: new Date(deadline).toISOString(),
    });

    setLoading(false);
    if (error) {
      toast.error("Failed to create challenge. Make sure you have manager access.");
      console.error(error);
    } else {
      toast.success("Challenge created!");
      onCreated();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q1 Cold Call Bootcamp" className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Practice cold calling with real objections..." className="mt-1" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scenario</label>
          <Select value={env} onValueChange={setEnv}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</label>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Prompt (optional)</label>
        <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Add a custom prospect objection or scenario context..." className="mt-1" rows={3} />
      </div>
      <Button variant="hero" className="w-full gap-2" onClick={handleCreate} disabled={loading}>
        <Plus className="h-4 w-4" />
        Create Challenge
      </Button>
    </div>
  );
}

// ─── Invite Code Copy ─────────────────────────────────────
function InviteCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/team/${code}`;

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Invite link copied!");
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground hover:bg-muted/60 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
      {code}
    </button>
  );
}

// ─── Challenge Detail ─────────────────────────────────────
function ChallengeDetail({ challenge }: { challenge: TeamChallenge }) {
  const [members, setMembers] = useState<ChallengeMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("team_challenge_members")
        .select("id, user_id, score, completed_at, joined_at")
        .eq("challenge_id", challenge.id)
        .order("score", { ascending: false, nullsFirst: false });

      if (data) {
        // Fetch profiles for each member
        const userIds = data.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, elo")
          .in("id", userIds);

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        setMembers(data.map((m: any) => ({
          ...m,
          profile: profileMap.get(m.user_id) || { display_name: "Unknown", avatar_url: null, elo: 1000 },
        })));
      }
      setLoading(false);
    })();
  }, [challenge.id]);

  const completed = members.filter((m) => m.score != null);
  const completionRate = members.length > 0 ? Math.round((completed.length / members.length) * 100) : 0;
  const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, m) => s + (m.score ?? 0), 0) / completed.length) : 0;
  const isExpired = new Date(challenge.deadline) < new Date();
  const env = ENVIRONMENTS.find((e) => e.id === challenge.scenario_env);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">{challenge.title}</h3>
          {challenge.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
          )}
        </div>
        <InviteCodeBadge code={challenge.invite_code} />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 flex-wrap">
        {env && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full">
            {env.title}
          </span>
        )}
        <span className={`text-[10px] font-semibold flex items-center gap-1 ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
          <Clock className="h-3 w-3" />
          {isExpired ? "Expired" : `Due ${new Date(challenge.deadline).toLocaleDateString()}`}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-elevated p-3 text-center">
          <p className="text-lg font-bold font-heading text-foreground">{completionRate}%</p>
          <p className="text-[10px] text-muted-foreground">Completion</p>
        </div>
        <div className="card-elevated p-3 text-center">
          <p className="text-lg font-bold font-heading text-foreground">{avgScore || "—"}</p>
          <p className="text-[10px] text-muted-foreground">Avg Score</p>
        </div>
        <div className="card-elevated p-3 text-center">
          <p className="text-lg font-bold font-heading text-foreground">{members.length}</p>
          <p className="text-[10px] text-muted-foreground">Team Size</p>
        </div>
      </div>

      {/* Team Leaderboard */}
      {loading ? (
        <div className="text-center py-4 text-sm text-muted-foreground">Loading team...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-xl">
          <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No team members yet</p>
          <p className="text-[10px] text-muted-foreground mt-1">Share the invite code to get started</p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/20">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Team Leaderboard</p>
          </div>
          <div className="divide-y divide-border/30">
            {members.map((member, i) => (
              <div key={member.id} className={`flex items-center gap-3 px-4 py-2.5 ${i === 0 && member.score != null ? "bg-primary/5" : ""}`}>
                <span className={`w-5 text-center text-xs font-bold tabular-nums ${
                  i === 0 ? "text-yellow-500" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <UserAvatar
                  avatarUrl={member.profile?.avatar_url ?? null}
                  displayName={member.profile?.display_name ?? "Unknown"}
                  elo={member.profile?.elo ?? 1000}
                  size="xs"
                  showRankBadge={false}
                  showName={false}
                />
                <span className="text-xs font-semibold text-foreground flex-1 truncate">
                  {member.profile?.display_name ?? "Unknown"}
                </span>
                {member.score != null ? (
                  <span className="text-sm font-bold font-heading text-foreground tabular-nums">{member.score}</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">Pending</span>
                )}
              </div>
            ))}
          </div>

          {/* Lowest performers callout */}
          {completed.length >= 3 && (() => {
            const lowest = [...completed].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 2);
            return (
              <div className="px-4 py-2.5 border-t border-border bg-destructive/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Needs Attention</span>
                </div>
                <div className="flex gap-3">
                  {lowest.map((m) => (
                    <span key={m.id} className="text-[11px] text-foreground">
                      {m.profile?.display_name}: <span className="font-bold text-destructive">{m.score}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function ManagerDashboard() {
  const { user, profile } = useAuth();
  const [challenges, setChallenges] = useState<TeamChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<TeamChallenge | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchChallenges = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("team_challenges")
      .select("*")
      .eq("manager_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setChallenges(data as TeamChallenge[]);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "manager" });
      setIsManager(!!data);
      if (data) await fetchChallenges();
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-16 max-w-3xl text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-16 max-w-xl text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-2">Sign in to access team management.</p>
          <Button variant="hero" className="mt-6" asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-16 max-w-xl text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-3">
            You need the <span className="font-semibold text-foreground">Manager</span> role to create team challenges.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Contact your administrator to get manager access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Manager Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Create and track team challenges</p>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Team Challenge</DialogTitle>
                </DialogHeader>
                <CreateChallengeForm onCreated={() => { setShowCreate(false); fetchChallenges(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {selectedChallenge ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => setSelectedChallenge(null)}
              className="text-xs text-primary font-semibold mb-4 hover:underline"
            >
              ← Back to challenges
            </button>
            <div className="card-elevated p-5">
              <ChallengeDetail challenge={selectedChallenge} />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {challenges.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-8 text-center"
              >
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-semibold">No challenges yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first team challenge to start tracking performance.
                </p>
              </motion.div>
            ) : (
              challenges.map((c, i) => {
                const isExpired = new Date(c.deadline) < new Date();
                const env = ENVIRONMENTS.find((e) => e.id === c.scenario_env);
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedChallenge(c)}
                    className="w-full card-elevated p-4 text-left hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{c.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {env && (
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              {env.title}
                            </span>
                          )}
                          <span className={`text-[10px] ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                            {isExpired ? "Expired" : `Due ${new Date(c.deadline).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
