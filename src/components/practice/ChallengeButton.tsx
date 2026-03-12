import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Swords, Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createChallenge, getChallengeUrl } from "./challengeMode";

interface ChallengeButtonProps {
  score: number;
  scenarioEnv: string;
  scenarioRole: string;
  isLoggedIn: boolean;
}

export function ChallengeButton({ score, scenarioEnv, scenarioRole, isLoggedIn }: ChallengeButtonProps) {
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!isLoggedIn) {
      toast("Sign in to challenge friends.", { duration: 2500 });
      return;
    }
    setCreating(true);
    try {
      const id = await createChallenge(scenarioEnv, scenarioRole, score);
      if (id) {
        const url = getChallengeUrl(id);
        setChallengeUrl(url);
        toast.success("Challenge created! Share the link.", { duration: 3000 });
      } else {
        toast.error("Failed to create challenge.");
      }
    } catch {
      toast.error("Failed to create challenge.");
    } finally {
      setCreating(false);
    }
  }, [isLoggedIn, score, scenarioEnv, scenarioRole]);

  const handleCopy = useCallback(() => {
    if (!challengeUrl) return;
    navigator.clipboard.writeText(challengeUrl).then(() => {
      setCopied(true);
      toast("Challenge link copied!", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Failed to copy."));
  }, [challengeUrl]);

  if (challengeUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="card-elevated p-3 flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">
            {challengeUrl}
          </span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Share this link. Your friend tries to beat your score of <span className="font-bold text-foreground">{score}</span>.
        </p>
      </motion.div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full h-9 text-xs gap-1.5"
      onClick={handleCreate}
      disabled={creating}
    >
      {creating ? (
        <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Swords className="h-3.5 w-3.5" />
      )}
      Challenge a Friend
    </Button>
  );
}
