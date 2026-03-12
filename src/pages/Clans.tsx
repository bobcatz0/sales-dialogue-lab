import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, Crown, Plus, Search, Lock, Globe, ChevronRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEloRank } from "@/lib/elo";
import { CreateClanDialog } from "@/components/clans/CreateClanDialog";
import { ClanDetail } from "@/components/clans/ClanDetail";
import { ClanWeeklyChallenge } from "@/components/clans/ClanWeeklyChallenge";

interface ClanRow {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  join_type: string;
  clan_elo: number;
  total_members: number;
  created_by: string;
  created_at: string;
}

function getClanRankColor(elo: number) {
  const rank = getEloRank(elo);
  switch (rank) {
    case "Sales Architect": return "text-purple-400";
    case "Rainmaker": return "text-yellow-400";
    case "Operator": return "text-blue-400";
    case "Closer": return "text-primary";
    case "Prospector": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

export default function Clans() {
  const { user } = useAuth();
  const [clans, setClans] = useState<ClanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClanId, setSelectedClanId] = useState<string | null>(null);
  const [userClanId, setUserClanId] = useState<string | null>(null);

  useEffect(() => {
    fetchClans();
    if (user) fetchUserClan();
  }, [user]);

  async function fetchClans() {
    setLoading(true);
    const { data } = await supabase
      .from("clans")
      .select("*")
      .order("clan_elo", { ascending: false });
    setClans((data as ClanRow[]) ?? []);
    setLoading(false);
  }

  async function fetchUserClan() {
    if (!user) return;
    const { data } = await supabase
      .from("clan_members")
      .select("clan_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setUserClanId(data?.clan_id ?? null);
  }

  const filtered = clans.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (selectedClanId) {
    return (
      <ClanDetail
        clanId={selectedClanId}
        onBack={() => { setSelectedClanId(null); fetchClans(); fetchUserClan(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="font-heading text-2xl font-bold text-foreground">Clans</h1>
            </div>
            {user && (
              <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create Clan
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Join a team. Compete together. Rise on the leaderboard.
          </p>
        </motion.div>

        {/* Your clan card */}
        {userClanId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-4 mb-6 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setSelectedClanId(userClanId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Your Clan</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            {(() => {
              const clan = clans.find(c => c.id === userClanId);
              if (!clan) return null;
              const rank = clans.indexOf(clan) + 1;
              return (
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{clan.name}</p>
                    <p className="text-[10px] text-muted-foreground">{clan.total_members} members</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold font-heading tabular-nums ${getClanRankColor(clan.clan_elo)}`}>
                      {clan.clan_elo}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Rank #{rank}</p>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search clans..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Clan leaderboard */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading clans...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "No clans match your search." : "No clans yet. Be the first to create one!"}
              </p>
            </div>
          ) : (
            filtered.map((clan, idx) => {
              const rank = getEloRank(clan.clan_elo);
              const isUserClan = clan.id === userClanId;

              return (
                <motion.div
                  key={clan.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedClanId(clan.id)}
                  className={`card-elevated p-4 cursor-pointer hover:border-primary/30 transition-colors ${
                    isUserClan ? "border-primary/20 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank number */}
                      <span className="text-lg font-bold font-heading tabular-nums text-muted-foreground w-8 text-center shrink-0">
                        {idx < 3 ? (
                          idx === 0 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> :
                          <Trophy className={`h-4 w-4 mx-auto ${idx === 1 ? "text-gray-400" : "text-amber-600"}`} />
                        ) : (
                          idx + 1
                        )}
                      </span>

                      {/* Clan info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{clan.name}</span>
                          {clan.join_type === "invite_only" ? (
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          ) : (
                            <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          {isUserClan && (
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                              Your Clan
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {clan.total_members}
                          </span>
                          <span className={`text-[10px] font-bold ${getClanRankColor(clan.clan_elo)}`}>
                            [{rank}]
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ELO */}
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold font-heading tabular-nums ${getClanRankColor(clan.clan_elo)}`}>
                        {clan.clan_elo}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Avg ELO</p>
                    </div>
                  </div>

                  {clan.description && (
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1 pl-11">
                      {clan.description}
                    </p>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Sign-in prompt */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-elevated p-6 mt-8 text-center"
          >
            <Shield className="h-8 w-8 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Sign in to create or join a clan.</p>
            <Link to="/login">
              <Button size="sm" variant="hero" className="gap-1.5">
                Sign In
              </Button>
            </Link>
          </motion.div>
        )}
      </div>

      <CreateClanDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(id) => { fetchClans(); fetchUserClan(); setSelectedClanId(id); }}
      />
    </div>
  );
}
