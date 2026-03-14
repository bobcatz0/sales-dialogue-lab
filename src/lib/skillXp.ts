/**
 * Skill XP & Leveling System
 * 
 * Each interview session awards XP to relevant skills based on the AI's
 * skill breakdown scores. Skills level up as XP accumulates.
 */

import { supabase } from "@/integrations/supabase/client";

// XP thresholds for each level (cumulative)
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  850,   // Level 5
  1300,  // Level 6
  1900,  // Level 7
  2600,  // Level 8
  3500,  // Level 9
  4500,  // Level 10 (max)
];

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export interface SkillXP {
  skill_name: string;
  xp: number;
  level: number;
}

export interface SkillLevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
}

const LEVEL_TITLES = [
  "Novice",
  "Apprentice",
  "Practitioner",
  "Specialist",
  "Expert",
  "Veteran",
  "Master",
  "Elite",
  "Champion",
  "Legend",
];

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getSkillLevelInfo(xp: number): SkillLevelInfo {
  const level = getLevelFromXp(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = level < MAX_LEVEL ? LEVEL_THRESHOLDS[level] : null;
  const progressPercent = nextThreshold
    ? Math.min(100, Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;

  return {
    level,
    title: LEVEL_TITLES[level - 1],
    currentXp: xp,
    xpForCurrentLevel: currentThreshold,
    xpForNextLevel: nextThreshold,
    progressPercent,
  };
}

/**
 * Calculate XP to award for a skill based on the session score.
 * Higher scores = more XP. Minimum 5 XP per skill per session.
 */
function calculateXpAward(skillScore: number, streakMultiplier: number = 1.0): number {
  let base: number;
  if (skillScore >= 90) base = 30;
  else if (skillScore >= 80) base = 25;
  else if (skillScore >= 70) base = 20;
  else if (skillScore >= 60) base = 15;
  else if (skillScore >= 50) base = 10;
  else base = 5;
  return Math.round(base * streakMultiplier);
}

/**
 * Award XP to skills after a session and return any level-ups.
 */
export async function awardSkillXp(
  userId: string,
  skillBreakdown: { name: string; score: number }[]
): Promise<{ levelUps: { skillName: string; newLevel: number; title: string }[] }> {
  const levelUps: { skillName: string; newLevel: number; title: string }[] = [];

  for (const skill of skillBreakdown) {
    const xpAward = calculateXpAward(skill.score);
    const skillName = skill.name;

    // Try to get existing skill record
    const { data: existing } = await supabase
      .from("user_skills")
      .select("id, xp, level")
      .eq("user_id", userId)
      .eq("skill_name", skillName)
      .maybeSingle();

    if (existing) {
      const newXp = existing.xp + xpAward;
      const newLevel = getLevelFromXp(newXp);
      const didLevelUp = newLevel > existing.level;

      await supabase
        .from("user_skills")
        .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (didLevelUp) {
        levelUps.push({ skillName, newLevel, title: LEVEL_TITLES[newLevel - 1] });
      }
    } else {
      const newXp = xpAward;
      const newLevel = getLevelFromXp(newXp);

      await supabase
        .from("user_skills")
        .insert({
          user_id: userId,
          skill_name: skillName,
          xp: newXp,
          level: newLevel,
        });
    }
  }

  return { levelUps };
}

/**
 * Fetch all skills for a user.
 */
export async function fetchUserSkills(userId: string): Promise<SkillXP[]> {
  const { data } = await supabase
    .from("user_skills")
    .select("skill_name, xp, level")
    .eq("user_id", userId)
    .order("xp", { ascending: false });

  return (data as SkillXP[]) ?? [];
}
