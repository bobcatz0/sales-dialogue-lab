import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, ChevronUp } from "lucide-react";
import { fetchUserSkills, getSkillLevelInfo, MAX_LEVEL, type SkillXP } from "@/lib/skillXp";

interface SkillLevelsDisplayProps {
  userId: string;
  refreshKey?: number; // increment to refetch
}

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-muted-foreground/30",
  2: "bg-muted-foreground/50",
  3: "bg-primary/30",
  4: "bg-primary/45",
  5: "bg-primary/60",
  6: "bg-primary/70",
  7: "bg-primary/80",
  8: "bg-primary/90",
  9: "bg-primary",
  10: "bg-primary",
};

export function SkillLevelsDisplay({ userId, refreshKey }: SkillLevelsDisplayProps) {
  const [skills, setSkills] = useState<SkillXP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchUserSkills(userId).then((data) => {
      setSkills(data);
      setLoading(false);
    });
  }, [userId, refreshKey]);

  if (loading || skills.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="h-3 w-3 text-primary" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Skill Levels
        </p>
      </div>
      <div className="space-y-2">
        {skills.map((skill) => {
          const info = getSkillLevelInfo(skill.xp);
          const barColor = LEVEL_COLORS[info.level] || "bg-primary";

          return (
            <div key={skill.skill_name} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground truncate flex-1">
                  {skill.skill_name}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-semibold ${
                    info.level >= 7 ? "text-primary" : "text-foreground"
                  }`}>
                    Lv.{info.level}
                  </span>
                  <span className="text-[8px] text-muted-foreground/60">
                    {info.title}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${info.progressPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>
              {info.xpForNextLevel && (
                <p className="text-[8px] text-muted-foreground/50 text-right tabular-nums">
                  {skill.xp - info.xpForCurrentLevel}/{info.xpForNextLevel - info.xpForCurrentLevel} XP
                </p>
              )}
              {info.level === MAX_LEVEL && (
                <p className="text-[8px] text-primary/60 text-right font-medium">MAX</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SkillLevelUpToastProps {
  skillName: string;
  newLevel: number;
  title: string;
}

export function SkillLevelUpToast({ skillName, newLevel, title }: SkillLevelUpToastProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <ChevronUp className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {skillName} → Lv.{newLevel}
        </p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
