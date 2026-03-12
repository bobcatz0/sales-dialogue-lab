import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ReferrerEntry {
  user_id: string;
  display_name: string;
  count: number;
}

interface ReferralLeaderboardProps {
  clanId: string;
  memberUserIds: string[];
}

export function ReferralLeaderboard({ clanId, memberUserIds }: ReferralLeaderboardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ReferrerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clanId) return;

    const fetch = async () => {
      setLoading(true);

      const { data: referrals } = await supabase
        .from("clan_referrals")
        .select("referred_by")
        .eq("clan_id", clanId);

      if (!referrals || referrals.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      // Count referrals per user
      const countMap = new Map<string, number>();
      for (const r of referrals) {
        countMap.set(r.referred_by, (countMap.get(r.referred_by) ?? 0) + 1);
      }

      const userIds = [...countMap.keys()];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

      const sorted = [...countMap.entries()]
        .map(([uid, count]) => ({
          user_id: uid,
          display_name: nameMap.get(uid) ?? "Unknown",
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setEntries(sorted);
      setLoading(false);
    };

    fetch();
  }, [clanId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <UserPlus className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No referrals yet. Share the invite link!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry, idx) => {
        const isMe = user?.id === entry.user_id;

        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`card-elevated px-4 py-2.5 flex items-center justify-between ${
              isMe ? "border-primary/20 bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold tabular-nums text-muted-foreground w-5 text-center shrink-0">
                {idx === 0 ? <Crown className="h-3.5 w-3.5 text-yellow-500 mx-auto" /> : idx + 1}
              </span>
              <span className="text-sm font-semibold text-foreground truncate">
                {entry.display_name}
              </span>
              {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-bold tabular-nums text-primary">{entry.count}</span>
              <span className="text-[10px] text-muted-foreground">recruits</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
