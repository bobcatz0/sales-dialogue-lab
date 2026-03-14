import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Users, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ENVIRONMENTS } from "@/components/practice/environments";

export default function JoinTeamChallenge() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      // Fetch challenge by invite code
      const { data } = await supabase
        .from("team_challenges")
        .select("*")
        .eq("invite_code", code)
        .maybeSingle();

      if (data) {
        setChallenge(data);
        // Check if already a member
        if (user) {
          const { data: membership } = await supabase
            .from("team_challenge_members")
            .select("id")
            .eq("challenge_id", data.id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (membership) setAlreadyMember(true);
        }
      }
      setLoading(false);
    })();
  }, [code, user]);

  const handleJoin = async () => {
    if (!user || !challenge) return;
    setJoining(true);
    const { error } = await supabase.from("team_challenge_members").insert({
      challenge_id: challenge.id,
      user_id: user.id,
    });
    setJoining(false);
    if (error) {
      toast.error("Failed to join challenge.");
      console.error(error);
    } else {
      setJoined(true);
      toast.success("You've joined the challenge!");
    }
  };

  const env = challenge ? ENVIRONMENTS.find((e) => e.id === challenge.scenario_env) : null;
  const isExpired = challenge ? new Date(challenge.deadline) < new Date() : false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16 max-w-lg">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : !challenge ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-8 text-center">
            <p className="text-foreground font-semibold">Challenge not found</p>
            <p className="text-xs text-muted-foreground mt-1">This invite code may be invalid or expired.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-elevated overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold mb-3">
                  <Users className="h-3 w-3" />
                  Team Challenge
                </div>
                <h1 className="font-heading text-2xl font-bold text-foreground">{challenge.title}</h1>
                {challenge.description && (
                  <p className="text-sm text-muted-foreground mt-2">{challenge.description}</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                {env && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 border border-border px-2.5 py-1 rounded-full">
                    {env.title}
                  </span>
                )}
                <span className={`text-[10px] font-semibold flex items-center gap-1 ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                  <Clock className="h-3 w-3" />
                  {isExpired ? "Expired" : `Due ${new Date(challenge.deadline).toLocaleDateString()}`}
                </span>
              </div>

              {!user ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Sign in to join this challenge</p>
                  <Button variant="hero" asChild>
                    <a href="/login">Sign In</a>
                  </Button>
                </div>
              ) : alreadyMember || joined ? (
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">You're in!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Complete the scenario before the deadline to appear on the leaderboard.</p>
                  <Button variant="hero" className="gap-2" asChild>
                    <Link to={`/practice?env=${challenge.scenario_env}&role=${challenge.scenario_role}&team=${challenge.id}`}>
                      Start Scenario
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : isExpired ? (
                <div className="text-center">
                  <p className="text-sm text-destructive font-semibold">This challenge has expired</p>
                </div>
              ) : (
                <Button variant="hero" className="w-full gap-2" onClick={handleJoin} disabled={joining}>
                  <Users className="h-4 w-4" />
                  Join Challenge
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
