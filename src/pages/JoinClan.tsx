import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";

type Status = "loading" | "not-found" | "banned" | "already-member" | "already-in-clan" | "ready" | "joining" | "success" | "error" | "needs-auth";

export default function JoinClan() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [clanName, setClanName] = useState("");
  const [clanId, setClanId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setStatus("needs-auth"); return; }
    if (!code) { setStatus("not-found"); return; }
    checkInvite();
  }, [code, user, authLoading]);

  async function checkInvite() {
    if (!user || !code) return;

    // Find clan by invite code
    const { data: clan } = await supabase
      .from("clans")
      .select("id, name, invite_code")
      .eq("invite_code", code)
      .single();

    if (!clan) { setStatus("not-found"); return; }
    setClanName(clan.name);
    setClanId(clan.id);

    // Check ban
    const { data: ban } = await supabase
      .from("clan_bans")
      .select("id")
      .eq("clan_id", clan.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ban) { setStatus("banned"); return; }

    // Check if already in this clan
    const { data: membership } = await supabase
      .from("clan_members")
      .select("id, clan_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.clan_id === clan.id) { setStatus("already-member"); return; }
    if (membership) { setStatus("already-in-clan"); return; }

    setStatus("ready");
  }

  async function handleJoin() {
    if (!user || !clanId) return;
    setStatus("joining");

    try {
      const { error } = await supabase
        .from("clan_members")
        .insert({ clan_id: clanId, user_id: user.id, role: "member" });

      if (error) throw error;

      // Record referral (best-effort — the invite_code owner = clan creator for now)
      const { data: clan } = await supabase
        .from("clans")
        .select("created_by")
        .eq("id", clanId)
        .single();

      if (clan) {
        await supabase
          .from("clan_referrals")
          .insert({
            clan_id: clanId,
            referred_user_id: user.id,
            referred_by: clan.created_by,
            points_awarded: 10,
          });
      }

      setStatus("success");
      toast.success(`Joined ${clanName}!`);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to join.");
      setStatus("error");
    }
  }

  const icon = {
    loading: <Loader2 className="h-8 w-8 text-primary animate-spin" />,
    joining: <Loader2 className="h-8 w-8 text-primary animate-spin" />,
    "not-found": <XCircle className="h-8 w-8 text-destructive" />,
    banned: <XCircle className="h-8 w-8 text-destructive" />,
    error: <XCircle className="h-8 w-8 text-destructive" />,
    "already-member": <CheckCircle2 className="h-8 w-8 text-primary" />,
    "already-in-clan": <Shield className="h-8 w-8 text-muted-foreground" />,
    ready: <Shield className="h-8 w-8 text-primary" />,
    success: <CheckCircle2 className="h-8 w-8 text-primary" />,
    "needs-auth": <LogIn className="h-8 w-8 text-primary" />,
  }[status];

  const message = {
    loading: "Checking invite link…",
    joining: "Joining clan…",
    "not-found": "This invite link is invalid or expired.",
    banned: "You are banned from this clan.",
    error: errorMsg || "Something went wrong.",
    "already-member": `You're already in ${clanName}!`,
    "already-in-clan": "You must leave your current clan first.",
    ready: `You've been invited to join`,
    success: `Welcome to ${clanName}! +10 referral points awarded.`,
    "needs-auth": "Sign in to accept this invite.",
  }[status];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-8 text-center space-y-4"
        >
          {icon}
          <p className="text-sm text-muted-foreground">{message}</p>

          {status === "ready" && (
            <>
              <h2 className="text-xl font-heading font-bold text-foreground">{clanName}</h2>
              <Button onClick={handleJoin} variant="default" className="w-full gap-1.5">
                <Shield className="h-4 w-4" /> Join Clan
              </Button>
            </>
          )}

          {status === "success" && (
            <Button onClick={() => navigate("/clans")} variant="default" className="w-full">
              Go to Clans
            </Button>
          )}

          {status === "needs-auth" && (
            <Button asChild variant="default" className="w-full gap-1.5">
              <Link to={`/login?redirect=/join/${code}`}>
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}

          {(status === "not-found" || status === "banned" || status === "error" || status === "already-member" || status === "already-in-clan") && (
            <Button onClick={() => navigate("/clans")} variant="outline" size="sm">
              Go to Clans
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
