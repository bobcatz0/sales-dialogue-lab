import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, ArrowRight, Trophy, Clock, Send, Loader2, Crown, Copy, Check, Mic, MicOff, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import { Link, useSearchParams } from "react-router-dom";
import { ENVIRONMENTS, type EnvironmentId } from "@/components/practice/environments";
import { roles } from "@/components/practice/roleData";
import { syncEloAfterSession } from "@/lib/eloSync";
import { ShareResultCard } from "@/components/practice/ShareResultCard";
import { getEloRank } from "@/lib/elo";

const BATTLE_PROMPTS: Record<string, { prospect: string; goal: string }[]> = {
  "cold-call": [
    { prospect: "We already have a solution for that.", goal: "Reopen the conversation and book a meeting." },
    { prospect: "I don't have time for this right now.", goal: "Earn 30 more seconds of attention." },
    { prospect: "Just send me an email.", goal: "Pivot to a specific value hook before agreeing." },
  ],
  "enterprise": [
    { prospect: "We're evaluating three other vendors.", goal: "Differentiate without bashing competitors." },
    { prospect: "The budget was already allocated to another project.", goal: "Reframe the ROI to justify reallocation." },
  ],
  "interview": [
    { prospect: "Tell me about a time you missed quota.", goal: "Show ownership, learning, and recovery." },
    { prospect: "Why should we hire you over other candidates?", goal: "Give a specific, memorable differentiator." },
  ],
};

function getRandomPrompt(env: string): { prospect: string; goal: string } {
  const prompts = BATTLE_PROMPTS[env] || BATTLE_PROMPTS["cold-call"];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

interface Battle {
  id: string;
  scenario_env: string;
  scenario_role: string;
  scenario_prompt: string;
  creator_id: string;
  creator_response: string | null;
  creator_score: number | null;
  creator_feedback: string | null;
  challenger_id: string | null;
  challenger_response: string | null;
  challenger_score: number | null;
  challenger_feedback: string | null;
  winner_id: string | null;
  creator_elo_delta: number | null;
  challenger_elo_delta: number | null;
  status: string;
  response_mode: string;
  created_at: string;
  completed_at: string | null;
}

export default function Battles() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const joinBattleId = searchParams.get("join");
  const [view, setView] = useState<"lobby" | "create" | "respond" | "scoring" | "result">(joinBattleId ? "respond" : "lobby");
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentId>("cold-call");
  const [battles, setBattles] = useState<Battle[]>([]);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load battles
  useEffect(() => {
    if (!user) return;
    const fetchBattles = async () => {
      const { data } = await supabase
        .from("battles")
        .select("*")
        .or(`creator_id.eq.${user.id},challenger_id.eq.${user.id},status.eq.waiting`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setBattles(data as unknown as Battle[]);
    };
    fetchBattles();

    // Realtime subscription for battle updates
    const channel = supabase
      .channel("battles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "battles" }, () => {
        fetchBattles();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Auto-load battle if joining via link
  useEffect(() => {
    if (joinBattleId && user) {
      const loadBattle = async () => {
        const { data } = await supabase
          .from("battles")
          .select("*")
          .eq("id", joinBattleId)
          .single();
        if (data) {
          setActiveBattle(data as unknown as Battle);
          setView("respond");
        } else {
          toast.error("Battle not found");
          setView("lobby");
        }
      };
      loadBattle();
    }
  }, [joinBattleId, user]);

  const handleCreate = async () => {
    if (!user) { toast.error("Sign in to create a battle"); return; }
    setIsCreating(true);
    const prompt = getRandomPrompt(selectedEnv);
    const env = ENVIRONMENTS.find(e => e.id === selectedEnv);
    const role = env ? roles.find(r => env.personaIds.includes(r.id)) : null;

    const { data, error } = await supabase
      .from("battles")
      .insert({
        scenario_env: selectedEnv,
        scenario_role: role?.id || "b2b-prospect",
        scenario_prompt: `${prompt.prospect}|||${prompt.goal}`,
        creator_id: user.id,
      } as any)
      .select("*")
      .single();

    setIsCreating(false);
    if (error || !data) { toast.error("Failed to create battle"); return; }
    setActiveBattle(data as unknown as Battle);
    setView("respond");
    setResponse("");
  };

  const parsePrompt = (prompt: string) => {
    const [prospect, goal] = prompt.split("|||");
    return { prospect: prospect || prompt, goal: goal || "Respond effectively." };
  };

  const handleSubmitResponse = async () => {
    if (!user || !activeBattle || !response.trim()) return;
    setIsSubmitting(true);

    const isCreator = user.id === activeBattle.creator_id;
    const isChallenger = activeBattle.challenger_id === user.id || (!activeBattle.creator_response && !isCreator) || (activeBattle.creator_response && !isCreator);

    if (isCreator && !activeBattle.creator_response) {
      // Creator submitting their response
      await supabase
        .from("battles")
        .update({ creator_response: response.trim() } as any)
        .eq("id", activeBattle.id);
      
      setActiveBattle(prev => prev ? { ...prev, creator_response: response.trim() } : null);
      toast.success("Response submitted! Share the link for your opponent.");
      setIsSubmitting(false);
      setResponse("");
    } else if (!isCreator && activeBattle.status === "waiting") {
      // Challenger joining and submitting
      await supabase
        .from("battles")
        .update({
          challenger_id: user.id,
          challenger_response: response.trim(),
          status: "scoring",
        } as any)
        .eq("id", activeBattle.id);

      setActiveBattle(prev => prev ? { ...prev, challenger_id: user.id, challenger_response: response.trim(), status: "scoring" } : null);
      setView("scoring");
      
      // Now score both responses
      const creatorResp = activeBattle.creator_response!;
      const challengerResp = response.trim();
      const { prospect } = parsePrompt(activeBattle.scenario_prompt);

      try {
        const { data: scoreData, error: scoreError } = await supabase.functions.invoke("battle-score", {
          body: {
            scenarioPrompt: prospect,
            responseA: creatorResp,
            responseB: challengerResp,
            scenarioEnv: activeBattle.scenario_env,
            scenarioRole: activeBattle.scenario_role,
          },
        });

        if (scoreError) throw scoreError;

        const { scoreA, scoreB, feedbackA, feedbackB, verdictReason } = scoreData;
        const winnerId = scoreA > scoreB ? activeBattle.creator_id : scoreB > scoreA ? user.id : null;
        const creatorEloDelta = scoreA > scoreB ? 12 : scoreA === scoreB ? 2 : -8;
        const challengerEloDelta = scoreB > scoreA ? 12 : scoreA === scoreB ? 2 : -8;

        await supabase
          .from("battles")
          .update({
            creator_score: scoreA,
            challenger_score: scoreB,
            creator_feedback: feedbackA,
            challenger_feedback: feedbackB,
            winner_id: winnerId,
            creator_elo_delta: creatorEloDelta,
            challenger_elo_delta: challengerEloDelta,
            status: "completed",
            completed_at: new Date().toISOString(),
          } as any)
          .eq("id", activeBattle.id);

        setActiveBattle(prev => prev ? {
          ...prev,
          creator_score: scoreA,
          challenger_score: scoreB,
          creator_feedback: feedbackA,
          challenger_feedback: feedbackB,
          winner_id: winnerId,
          creator_elo_delta: creatorEloDelta,
          challenger_elo_delta: challengerEloDelta,
          status: "completed",
        } : null);
        
        setView("result");
      } catch (err) {
        console.error("Scoring failed:", err);
        toast.error("Scoring failed. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const copyBattleLink = () => {
    if (!activeBattle) return;
    const url = `${window.location.origin}/battles?join=${activeBattle.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Battle link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const myBattles = battles.filter(b => b.creator_id === user?.id || b.challenger_id === user?.id);
  const openBattles = battles.filter(b => b.status === "waiting" && b.creator_id !== user?.id && b.creator_response);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 max-w-2xl text-center">
          <Swords className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">1v1 Sales Battle</h1>
          <p className="text-muted-foreground mb-6">Sign in to challenge other players.</p>
          <Button asChild><Link to="/login">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Swords className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">1v1 Battle</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-1">Sales Battle Arena</h1>
          <p className="text-sm text-muted-foreground">Same scenario. Two responses. AI picks the winner.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ─── LOBBY ─── */}
          {view === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Create battle */}
              <div className="rounded-2xl border border-border bg-card p-6 mb-6">
                <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Start a Battle
                </h2>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(["cold-call", "enterprise", "interview"] as EnvironmentId[]).map(env => {
                    const e = ENVIRONMENTS.find(x => x.id === env)!;
                    return (
                      <button
                        key={env}
                        onClick={() => setSelectedEnv(env)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          selectedEnv === env
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <e.icon className={`h-4 w-4 mb-1 ${selectedEnv === env ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="text-xs font-semibold">{e.title}</p>
                      </button>
                    );
                  })}
                </div>
                <Button onClick={handleCreate} disabled={isCreating} className="w-full gap-2">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
                  Create Battle
                </Button>
              </div>

              {/* Open battles to join */}
              {openBattles.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 mb-6">
                  <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" /> Open Battles
                  </h2>
                  <div className="space-y-2">
                    {openBattles.map(b => {
                      const { prospect } = parsePrompt(b.scenario_prompt);
                      return (
                        <div key={b.id} className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">"{prospect}"</p>
                            <p className="text-[10px] text-muted-foreground">{b.scenario_env} • {new Date(b.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setActiveBattle(b); setView("respond"); setResponse(""); }}
                            className="gap-1 shrink-0"
                          >
                            Accept <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* My battles history */}
              {myBattles.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" /> My Battles
                  </h2>
                  <div className="space-y-2">
                    {myBattles.map(b => {
                      const isMe = b.creator_id === user?.id;
                      const myScore = isMe ? b.creator_score : b.challenger_score;
                      const won = b.winner_id === user?.id;
                      const tied = b.status === "completed" && !b.winner_id;
                      return (
                        <div
                          key={b.id}
                          className={`rounded-xl border p-3 cursor-pointer transition-colors hover:bg-muted/20 ${
                            b.status === "completed"
                              ? won ? "border-primary/30" : tied ? "border-border" : "border-destructive/20"
                              : "border-border"
                          }`}
                          onClick={() => { setActiveBattle(b); setView(b.status === "completed" ? "result" : b.status === "scoring" ? "scoring" : "respond"); }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{b.scenario_env}</span>
                              {b.status === "completed" && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  won ? "bg-primary/10 text-primary" : tied ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"
                                }`}>
                                  {won ? "WON" : tied ? "TIE" : "LOST"}
                                </span>
                              )}
                              {b.status === "waiting" && (
                                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Waiting</span>
                              )}
                            </div>
                            {myScore !== null && (
                              <span className="text-sm font-bold font-heading">{myScore}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── RESPOND ─── */}
          {view === "respond" && activeBattle && (
            <motion.div key="respond" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                <div className="p-6">
                  {/* Scenario */}
                  {(() => {
                    const { prospect, goal } = parsePrompt(activeBattle.scenario_prompt);
                    const isCreator = user.id === activeBattle.creator_id;
                    const hasSubmitted = isCreator ? !!activeBattle.creator_response : !!activeBattle.challenger_response;
                    return (
                      <>
                        <div className="mb-6">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Prospect says:</p>
                          <div className="rounded-xl bg-muted/30 border border-border p-4 mb-3">
                            <p className="text-sm font-medium text-foreground italic">"{prospect}"</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Goal:</span> {goal}
                          </p>
                        </div>

                        {/* Already submitted — show share link */}
                        {isCreator && hasSubmitted && activeBattle.status === "waiting" ? (
                          <div className="space-y-4">
                            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                              <Check className="h-5 w-5 text-primary mx-auto mb-2" />
                              <p className="text-sm font-semibold text-foreground mb-1">Response submitted!</p>
                              <p className="text-xs text-muted-foreground mb-3">Share this link with your opponent:</p>
                              <Button onClick={copyBattleLink} variant="outline" className="gap-2">
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? "Copied!" : "Copy Battle Link"}
                              </Button>
                            </div>
                            <Button variant="ghost" className="w-full" onClick={() => { setView("lobby"); setActiveBattle(null); }}>
                              Back to Lobby
                            </Button>
                          </div>
                        ) : (
                          /* Response input */
                          <div className="space-y-3">
                            <Textarea
                              value={response}
                              onChange={e => setResponse(e.target.value)}
                              placeholder="Write your sales response..."
                              className="min-h-[120px] resize-none"
                              maxLength={1000}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">{response.length}/1000</span>
                              <Button onClick={handleSubmitResponse} disabled={isSubmitting || !response.trim()} className="gap-2">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Submit Response
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <Button variant="ghost" className="mt-4 w-full" onClick={() => { setView("lobby"); setActiveBattle(null); }}>
                ← Back to Lobby
              </Button>
            </motion.div>
          )}

          {/* ─── SCORING ─── */}
          {view === "scoring" && (
            <motion.div key="scoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                <h2 className="font-heading text-xl font-bold mb-2">AI is Judging...</h2>
                <p className="text-sm text-muted-foreground">Both responses submitted. The AI is scoring them now.</p>
              </div>
            </motion.div>
          )}

          {/* ─── RESULT ─── */}
          {view === "result" && activeBattle && activeBattle.status === "completed" && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              {(() => {
                const isCreator = user.id === activeBattle.creator_id;
                const myScore = isCreator ? activeBattle.creator_score : activeBattle.challenger_score;
                const theirScore = isCreator ? activeBattle.challenger_score : activeBattle.creator_score;
                const myFeedback = isCreator ? activeBattle.creator_feedback : activeBattle.challenger_feedback;
                const theirFeedback = isCreator ? activeBattle.challenger_feedback : activeBattle.creator_feedback;
                const myDelta = isCreator ? activeBattle.creator_elo_delta : activeBattle.challenger_elo_delta;
                const won = activeBattle.winner_id === user.id;
                const tied = !activeBattle.winner_id;

                return (
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {/* Result banner */}
                    <div className={`p-6 text-center ${
                      won ? "bg-primary/5" : tied ? "bg-muted/30" : "bg-destructive/5"
                    }`}>
                      {won && <Crown className="h-8 w-8 text-primary mx-auto mb-2" />}
                      <h2 className="font-heading text-2xl font-bold mb-1">
                        {won ? "Victory!" : tied ? "Draw" : "Defeated"}
                      </h2>
                      <p className={`text-sm font-semibold ${
                        (myDelta ?? 0) >= 0 ? "text-primary" : "text-destructive"
                      }`}>
                        {(myDelta ?? 0) >= 0 ? "+" : ""}{myDelta} ELO
                      </p>
                    </div>

                    {/* Scores */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`rounded-xl border p-4 text-center ${won ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">You</p>
                          <p className="text-3xl font-bold font-heading text-foreground">{myScore}</p>
                          {myFeedback && <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{myFeedback}</p>}
                        </div>
                        <div className={`rounded-xl border p-4 text-center ${!won && !tied ? "border-destructive/20 bg-destructive/5" : "border-border"}`}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Opponent</p>
                          <p className="text-3xl font-bold font-heading text-muted-foreground">{theirScore}</p>
                          {theirFeedback && <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{theirFeedback}</p>}
                        </div>
                      </div>

                      {/* Share Result Card */}
                      <ShareResultCard
                        scenarioTitle={(() => {
                          const { prospect } = parsePrompt(activeBattle.scenario_prompt);
                          return prospect.length > 40 ? prospect.slice(0, 40) + "…" : prospect;
                        })()}
                        score={myScore ?? 0}
                        rank={getEloRank(profile?.elo ?? 1000)}
                        eloDelta={myDelta}
                        elo={profile?.elo ?? null}
                        isBattle
                        opponentScore={theirScore}
                        won={won}
                      />

                      <div className="flex gap-2">
                        <Button className="flex-1 gap-2" onClick={() => { setView("lobby"); setActiveBattle(null); setResponse(""); }}>
                          <Swords className="h-4 w-4" /> New Battle
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={copyBattleLink}>
                          <Link2 className="h-4 w-4" /> Share
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
