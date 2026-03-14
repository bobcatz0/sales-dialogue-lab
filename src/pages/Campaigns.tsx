import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Map, Trophy, RotateCcw } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import ScenarioChainCard from "@/components/scenarios/ScenarioChainCard";
import { CAMPAIGNS } from "@/components/campaigns/campaignData";
import { loadChainProgress, resetChainProgress } from "@/components/scenarios/chainStorage";
import type { ChainProgress } from "@/components/scenarios/types";
import { getEloRank, type RankTier } from "@/lib/elo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Campaigns() {
  const { user } = useAuth();
  const [chainProgress, setChainProgress] = useState<Record<string, ChainProgress>>({});
  const [userRank, setUserRank] = useState<RankTier>("Rookie");

  useEffect(() => {
    setChainProgress(loadChainProgress());
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("elo")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setUserRank(getEloRank(data.elo));
      });
  }, [user]);

  const handleReset = (chainId: string) => {
    resetChainProgress(chainId);
    setChainProgress(loadChainProgress());
  };

  const completedCampaigns = CAMPAIGNS.filter((c) => chainProgress[c.id]?.completed).length;
  const totalStagesCompleted = CAMPAIGNS.reduce(
    (sum, c) => sum + (chainProgress[c.id]?.stageResults.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
            <Map className="h-3 w-3" />
            Campaign Mode
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Full Sales Campaigns
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto">
            Multi-stage journeys that simulate a complete sales process. Complete every stage
            sequentially and earn your campaign score.
          </p>
        </motion.div>

        {/* Stats */}
        {totalStagesCompleted > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            {[
              { label: "Campaigns Done", value: completedCampaigns, icon: Trophy },
              { label: "Stages Cleared", value: totalStagesCompleted, icon: Map },
              {
                label: "Best Avg Score",
                value:
                  CAMPAIGNS.reduce((best, c) => {
                    const avg = chainProgress[c.id]?.averageScore;
                    return avg && avg > best ? avg : best;
                  }, 0) || "—",
                icon: Trophy,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <stat.icon className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Campaign Cards */}
        <div className="space-y-6">
          {CAMPAIGNS.map((campaign, idx) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <ScenarioChainCard
                chain={campaign}
                progress={chainProgress[campaign.id] ?? null}
                userRank={userRank}
                onReset={handleReset}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
