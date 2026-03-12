import { useState, useEffect } from "react";
import { Bell, Trophy, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: "invite" | "badge";
  title: string;
  detail: string;
  createdAt: string;
}

const SEEN_NOTIFS_KEY = "seen_notification_ids";

function getSeenIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_NOTIFS_KEY) || "[]"); }
  catch { return []; }
}

function markAllSeen(ids: string[]) {
  const seen = getSeenIds();
  const merged = [...new Set([...seen, ...ids])];
  localStorage.setItem(SEEN_NOTIFS_KEY, JSON.stringify(merged.slice(-100)));
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (open && unseenCount > 0) {
      markAllSeen(notifications.map((n) => n.id));
      setUnseenCount(0);
    }
  }, [open]);

  async function fetchNotifications() {
    if (!user) return;

    const results: Notification[] = [];

    // Fetch pending clan invites
    const { data: invites } = await supabase
      .from("clan_invites")
      .select("id, clan_id, created_at, status")
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10);

    if (invites && invites.length > 0) {
      const clanIds = [...new Set(invites.map((i) => i.clan_id))];
      const { data: clans } = await supabase
        .from("clans")
        .select("id, name")
        .in("id", clanIds);
      const clanMap = new Map((clans ?? []).map((c) => [c.id, c.name]));

      for (const inv of invites) {
        results.push({
          id: `invite-${inv.id}`,
          type: "invite",
          title: "Clan Invite",
          detail: `You've been invited to ${clanMap.get(inv.clan_id) ?? "a clan"}`,
          createdAt: inv.created_at,
        });
      }
    }

    // Fetch recent badge awards
    const { data: badges } = await supabase
      .from("weekly_challenge_badges")
      .select("id, clan_name, week_start, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    for (const b of badges ?? []) {
      const weekLabel = new Date(b.week_start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      results.push({
        id: `badge-${b.id}`,
        type: "badge",
        title: "Weekly Champion 🏆",
        detail: `${b.clan_name} · Week of ${weekLabel}`,
        createdAt: b.created_at,
      });
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const seen = getSeenIds();
    const unseen = results.filter((n) => !seen.includes(n.id)).length;

    setNotifications(results);
    setUnseenCount(unseen);
  }

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          {unseenCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center animate-scale-in">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-xs font-semibold text-foreground">Notifications</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <Bell className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-3 py-2.5 flex items-start gap-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === "invite"
                      ? "bg-primary/10"
                      : "bg-accent"
                  }`}>
                    {n.type === "invite" ? (
                      <UserPlus className="h-3 w-3 text-primary" />
                    ) : (
                      <Trophy className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{n.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
            <a
              href="/clans"
              className="text-[11px] text-primary hover:underline font-medium"
            >
              View all clan activity →
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
