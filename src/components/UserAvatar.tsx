import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getEloRank, type RankTier } from "@/lib/elo";

function getRankColor(rank: RankTier): string {
  switch (rank) {
    case "Sales Architect": return "border-purple-400 shadow-purple-400/20";
    case "Rainmaker": return "border-yellow-400 shadow-yellow-400/20";
    case "Operator": return "border-blue-400 shadow-blue-400/20";
    case "Closer": return "border-primary shadow-primary/20";
    case "Prospector": return "border-orange-400 shadow-orange-400/20";
    default: return "border-border";
  }
}

function getRankTextColor(rank: RankTier): string {
  switch (rank) {
    case "Sales Architect": return "text-purple-400";
    case "Rainmaker": return "text-yellow-400";
    case "Operator": return "text-blue-400";
    case "Closer": return "text-primary";
    case "Prospector": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

type AvatarSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, { avatar: string; icon: string; badge: string; badgeText: string }> = {
  xs: { avatar: "h-6 w-6", icon: "h-3 w-3", badge: "", badgeText: "" },
  sm: { avatar: "h-8 w-8", icon: "h-4 w-4", badge: "text-[9px]", badgeText: "text-[9px]" },
  md: { avatar: "h-10 w-10", icon: "h-5 w-5", badge: "text-[10px]", badgeText: "text-[10px]" },
  lg: { avatar: "h-14 w-14", icon: "h-7 w-7", badge: "text-xs", badgeText: "text-xs" },
};

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string;
  elo?: number;
  size?: AvatarSize;
  showRankBadge?: boolean;
  showName?: boolean;
  isHighlighted?: boolean;
  className?: string;
}

export function UserAvatar({
  avatarUrl,
  displayName = "Unknown",
  elo = 1000,
  size = "sm",
  showRankBadge = true,
  showName = false,
  isHighlighted = false,
  className = "",
}: UserAvatarProps) {
  const rank = getEloRank(elo);
  const s = sizeClasses[size];
  const rankColor = getRankColor(rank);
  const rankText = getRankTextColor(rank);

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <div className="relative shrink-0">
        <Avatar className={`${s.avatar} border-2 ${rankColor} shadow-sm`}>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-muted">
            <User className={`${s.icon} text-muted-foreground`} />
          </AvatarFallback>
        </Avatar>
      </div>

      {(showName || showRankBadge) && (
        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
          {showName && (
            <span className={`font-semibold truncate ${s.badgeText} ${isHighlighted ? "text-primary" : "text-foreground"}`}>
              {displayName}
            </span>
          )}
          {showRankBadge && (
            <span className={`font-bold ${s.badge} ${rankText}`}>
              [{rank}]
            </span>
          )}
        </div>
      )}
    </div>
  );
}
