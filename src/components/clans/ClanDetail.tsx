import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, ArrowLeft, Users, Crown, Settings, UserPlus, UserMinus,
  Globe, Lock, LogIn, Ban, ChevronUp, ChevronDown, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEloRank } from "@/lib/elo";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import { Link } from "react-router-dom";
import { ClanActivityFeed } from "./ClanActivityFeed";
import { InviteLinkSection } from "./InviteLinkSection";
import { ReferralLeaderboard } from "./ReferralLeaderboard";
import { ClanChat } from "./ClanChat";
import { UserAvatar } from "@/components/UserAvatar";
import { ClanRivalry } from "./ClanRivalry";

interface ClanDetailProps {
  clanId: string;
  onBack: () => void;
}

interface ClanData {
  id: string;
  name: string;
  description: string | null;
  join_type: string;
  clan_elo: number;
  total_members: number;
  created_by: string;
  invite_code: string;
  referral_points: number;
}

interface MemberData {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    display_name: string;
    elo: number;
    avatar_url: string | null;
  };
}

function getRankColor(rank: string) {
  switch (rank) {
    case "Sales Architect": return "text-purple-400";
    case "Rainmaker": return "text-yellow-400";
    case "Operator": return "text-blue-400";
    case "Closer": return "text-primary";
    case "Prospector": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case "leader": return <Badge variant="default" className="text-[8px] px-1.5 py-0 h-4 gap-0.5"><Crown className="h-2.5 w-2.5" /> Leader</Badge>;
    case "officer": return <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 gap-0.5"><Shield className="h-2.5 w-2.5" /> Officer</Badge>;
    default: return null;
  }
}

export function ClanDetail({ clanId, onBack }: ClanDetailProps) {
  const { user } = useAuth();
  const [clan, setClan] = useState<ClanData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchClan();
  }, [clanId]);

  async function fetchClan() {
    setLoading(true);

    const { data: clanData } = await supabase
      .from("clans")
      .select("*")
      .eq("id", clanId)
      .single();

    if (clanData) setClan(clanData as ClanData);

    // Fetch members with profiles
    const { data: memberData } = await supabase
      .from("clan_members")
      .select("id, user_id, role, joined_at")
      .eq("clan_id", clanId)
      .order("role", { ascending: true });

    if (memberData) {
      // Fetch profiles for all members
      const userIds = memberData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, elo, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
      const enriched = memberData.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? undefined,
      })) as MemberData[];

      // Sort: leader first, then by ELO desc
      enriched.sort((a, b) => {
        const roleOrder: Record<string, number> = { leader: 0, officer: 1, member: 2 };
        const rDiff = (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2);
        if (rDiff !== 0) return rDiff;
        return (b.profile?.elo ?? 0) - (a.profile?.elo ?? 0);
      });

      setMembers(enriched);

      if (user) {
        const myMembership = enriched.find(m => m.user_id === user.id);
        setIsMember(!!myMembership);
        setUserRole(myMembership?.role ?? null);
      }
    }

    setLoading(false);
  }

  async function handleJoin() {
    if (!user || !clan) return;
    setActionLoading(true);
    try {
      // Check bans
      const { data: banned } = await supabase
        .from("clan_bans")
        .select("id")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (banned) {
        toast.error("You are banned from this clan.");
        setActionLoading(false);
        return;
      }

      // Check if already in another clan
      const { data: existing } = await supabase
        .from("clan_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast.error("You must leave your current clan first.");
        setActionLoading(false);
        return;
      }

      const { error } = await supabase
        .from("clan_members")
        .insert({ clan_id: clanId, user_id: user.id, role: "member" });

      if (error) throw error;
      toast.success(`Joined ${clan.name}!`);
      fetchClan();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to join.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    if (!user) return;
    if (userRole === "leader") {
      toast.error("Transfer leadership before leaving.");
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("clan_members")
        .delete()
        .eq("clan_id", clanId)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Left clan.");
      fetchClan();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to leave.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleKick(memberId: string, memberUserId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("clan_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Member removed.");
      fetchClan();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove member.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePromote(memberId: string, currentRole: string) {
    const newRole = currentRole === "member" ? "officer" : "member";
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("clan_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;
      toast.success(`Role updated to ${newRole}.`);
      fetchClan();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update role.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBan(memberUserId: string, memberId: string) {
    if (!user) return;
    setActionLoading(true);
    try {
      // Remove from clan first
      await supabase.from("clan_members").delete().eq("id", memberId);

      // Add ban
      const { error } = await supabase
        .from("clan_bans")
        .insert({ clan_id: clanId, user_id: memberUserId, banned_by: user.id });

      if (error) throw error;
      toast.success("Member banned.");
      fetchClan();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to ban member.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-12 max-w-4xl">
          <p className="text-sm text-muted-foreground text-center py-20">Loading clan...</p>
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-12 max-w-4xl text-center py-20">
          <p className="text-sm text-muted-foreground">Clan not found.</p>
          <Button variant="ghost" size="sm" onClick={onBack} className="mt-4">Back</Button>
        </div>
      </div>
    );
  }

  const clanRank = getEloRank(clan.clan_elo);
  const isLeader = userRole === "leader";
  const isOfficer = userRole === "officer";
  const canManage = isLeader || isOfficer;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-4xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All Clans
        </Button>

        {/* Clan header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="font-heading text-xl font-bold text-foreground">{clan.name}</h1>
                {clan.join_type === "invite_only" ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              {clan.description && (
                <p className="text-sm text-muted-foreground mt-1.5">{clan.description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5">
            <div className="text-center">
              <p className={`text-2xl font-bold font-heading ${getRankColor(clanRank)}`}>
                {clan.clan_elo}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Clan ELO</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold font-heading ${getRankColor(clanRank)}`}>
                {clanRank}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Clan Rank</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-heading text-foreground">
                {clan.total_members}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Members</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5">
            {user && !isMember && clan.join_type === "public" && (
              <Button onClick={handleJoin} disabled={actionLoading} size="sm" variant="hero" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" /> Join Clan
              </Button>
            )}
            {user && !isMember && clan.join_type === "invite_only" && (
              <Badge variant="outline" className="text-xs px-3 py-1.5 text-muted-foreground">
                <Lock className="h-3 w-3 mr-1" /> Invite Only
              </Badge>
            )}
            {isMember && userRole !== "leader" && (
              <Button onClick={handleLeave} disabled={actionLoading} size="sm" variant="outline" className="gap-1.5 text-destructive">
                Leave Clan
              </Button>
            )}
            {!user && (
              <Link to="/login">
                <Button size="sm" variant="hero" className="gap-1.5">
                  <LogIn className="h-3.5 w-3.5" /> Sign In to Join
                </Button>
              </Link>
            )}
          </div>

          {/* Invite Link */}
          {isMember && clan.invite_code && (
            <div className="mt-5 pt-5 border-t border-border">
              <InviteLinkSection
                inviteCode={clan.invite_code}
                referralPoints={clan.referral_points}
                canManage={canManage}
              />
            </div>
          )}
        </motion.div>

        {/* Member leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Members ({members.length})
          </h2>

          <div className="space-y-1.5">
            {members.map((member, idx) => {
              const profile = member.profile;
              const elo = profile?.elo ?? 1000;
              const rank = getEloRank(elo);
              const isMe = user?.id === member.user_id;
              const canManageThis = canManage && !isMe && member.role !== "leader";

              return (
                <div
                  key={member.id}
                  className={`card-elevated px-4 py-3 flex items-center justify-between ${
                    isMe ? "border-primary/20 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold tabular-nums text-muted-foreground w-6 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <UserAvatar
                      avatarUrl={profile?.avatar_url}
                      displayName={profile?.display_name ?? "Unknown"}
                      elo={elo}
                      size="sm"
                      showRankBadge={true}
                      showName={true}
                      isHighlighted={isMe}
                    />
                    {getRoleBadge(member.role)}
                    {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold tabular-nums ${getRankColor(rank)}`}>
                      {elo}
                    </span>

                    {/* Management actions */}
                    {canManageThis && (
                      <div className="flex items-center gap-1 ml-2">
                        {isLeader && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handlePromote(member.id, member.role)}
                            title={member.role === "member" ? "Promote to Officer" : "Demote to Member"}
                          >
                            {member.role === "member" ? (
                              <ChevronUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleKick(member.id, member.user_id)}
                          title="Remove from clan"
                        >
                          <UserMinus className="h-3 w-3 text-destructive" />
                        </Button>
                        {isLeader && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleBan(member.user_id, member.id)}
                            title="Ban from clan"
                          >
                            <Ban className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Clan Chat */}
        {isMember && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6"
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Clan Chat
            </h2>
            <ClanChat clanId={clanId} />
          </motion.div>
        )}

        {/* Referral Leaderboard */}
        {isMember && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6"
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Top Recruiters
            </h2>
            <ReferralLeaderboard clanId={clanId} memberUserIds={members.map((m) => m.user_id)} />
          </motion.div>
        )}

        {/* Activity Feed */}
        {isMember && members.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Recent Activity
            </h2>
            <ClanActivityFeed memberUserIds={members.map((m) => m.user_id)} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
