import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyBadge {
  id: string;
  clan_name: string;
  week_start: string;
  badge_type: string;
}

interface WeeklyChallengeBadgesProps {
  userId: string;
  compact?: boolean;
}

export function WeeklyChallengeBadges({ userId, compact = false }: WeeklyChallengeBadgesProps) {
  const [badges, setBadges] = useState<WeeklyBadge[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("weekly_challenge_badges")
      .select("id, clan_name, week_start, badge_type")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(12)
      .then(({ data }) => setBadges(data ?? []));
  }, [userId]);

  if (badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {badges.slice(0, 4).map((b) => (
          <Badge
            key={b.id}
            variant="secondary"
            className="text-[9px] gap-0.5 px-1.5 py-0 h-4 bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
            title={`Weekly Champion · ${b.clan_name} · ${new Date(b.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          >
            <Trophy className="h-2 w-2" />
            🏆
          </Badge>
        ))}
        {badges.length > 4 && (
          <span className="text-[9px] text-muted-foreground">+{badges.length - 4}</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Weekly Challenge Wins
      </p>
      <div className="flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <Badge
            key={b.id}
            variant="secondary"
            className="text-[10px] gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
          >
            <Trophy className="h-2.5 w-2.5" />
            {b.clan_name}
            <span className="text-muted-foreground">
              · {new Date(b.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
