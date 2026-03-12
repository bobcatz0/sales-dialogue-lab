import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SEEN_KEY = "weekly_champion_badges_seen";

function getSeenBadgeIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function markBadgeSeen(id: string) {
  const seen = getSeenBadgeIds();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }
}

interface UnseenBadge {
  id: string;
  clan_name: string;
  week_start: string;
}

const confettiEmojis = ["🏆", "⭐", "🎉", "🔥", "👑", "💎"];

async function playCelebrationSfx() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: "Triumphant victory fanfare with sparkle chimes and a crowd cheering, celebratory and exciting",
          duration: 3,
        }),
      }
    );
    if (!response.ok) return;
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.volume = 0.6;
    await audio.play();
  } catch {
    // Silent fail — SFX is non-critical
  }
}

export function WeeklyChampionCelebration() {
  const { user } = useAuth();
  const [badge, setBadge] = useState<UnseenBadge | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function checkForNewBadges() {
      const { data } = await supabase
        .from("weekly_challenge_badges")
        .select("id, clan_name, week_start")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!data || data.length === 0) return;

      const seen = getSeenBadgeIds();
      const unseen = data.find((b) => !seen.includes(b.id));
      if (unseen) {
        setBadge(unseen);
        setOpen(true);
      }
    }

    // Small delay so it doesn't block initial render
    const timer = setTimeout(checkForNewBadges, 1500);
    return () => clearTimeout(timer);
  }, [user]);

  function handleClose() {
    if (badge) markBadgeSeen(badge.id);
    setOpen(false);
    setBadge(null);
  }

  const weekLabel = badge
    ? new Date(badge.week_start).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-yellow-500/20 bg-background">
        {/* Confetti particles */}
        <AnimatePresence>
          {open && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {confettiEmojis.map((emoji, i) => (
                <motion.span
                  key={i}
                  initial={{
                    opacity: 0,
                    y: -20,
                    x: `${15 + i * 14}%`,
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: ["0%", "80%"],
                    scale: [0, 1.2, 1, 0.8],
                    rotate: [0, (i % 2 === 0 ? 1 : -1) * 360],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.2 + i * 0.15,
                    ease: "easeOut",
                  }}
                  className="absolute text-xl"
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="relative z-10 flex flex-col items-center text-center px-6 py-8">
          {/* Trophy icon with spring animation */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.1,
                }}
                className="relative mb-4"
              >
                {/* Glow ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full bg-yellow-500/20 blur-md"
                />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
                {/* Crown on top */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  <Crown className="h-5 w-5 text-yellow-500" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title with staggered reveal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center gap-1.5 justify-center mb-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <h2 className="font-heading text-lg font-bold text-foreground">
                Weekly Champion!
              </h2>
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-sm text-muted-foreground mt-1"
          >
            Your clan dominated the weekly challenge
          </motion.p>

          {/* Badge details */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 300 }}
            className="mt-4 px-4 py-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5"
          >
            <p className="text-base font-bold text-foreground font-heading">
              {badge?.clan_name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Week of {weekLabel}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="text-xs text-muted-foreground mt-3"
          >
            This badge is now displayed on your profile
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="mt-4"
          >
            <Button onClick={handleClose} size="sm" className="px-6">
              Awesome!
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
