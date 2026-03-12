import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  clan_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ClanChatProps {
  clanId: string;
}

export function ClanChat({ clanId }: ClanChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef<Map<string, { display_name: string; avatar_url: string | null }>>(new Map());

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`clan-chat-${clanId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clan_messages",
          filter: `clan_id=eq.${clanId}`,
        },
        async (payload) => {
          const msg = payload.new as ChatMessage;
          // Fetch profile for new message
          let profile = profileCache.current.get(msg.user_id);
          if (!profile) {
            const { data } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", msg.user_id)
              .single();
            if (data) {
              profile = data;
              profileCache.current.set(msg.user_id, data);
            }
          }
          msg.profile = profile;
          setMessages((prev) => [...prev, msg]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "clan_messages",
          filter: `clan_id=eq.${clanId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clanId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    setLoading(true);
    const { data: msgs } = await supabase
      .from("clan_messages")
      .select("id, clan_id, user_id, content, created_at")
      .eq("clan_id", clanId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (msgs && msgs.length > 0) {
      const userIds = [...new Set(msgs.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );
      profileMap.forEach((v, k) => profileCache.current.set(k, v));

      const enriched = msgs.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id),
      }));
      setMessages(enriched);
    } else {
      setMessages([]);
    }
    setLoading(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("clan_messages")
      .insert({ clan_id: clanId, user_id: user.id, content: newMessage.trim() });
    if (error) {
      toast.error("Failed to send message.");
    }
    setNewMessage("");
    setSending(false);
  }

  async function handleDelete(msgId: string) {
    const { error } = await supabase.from("clan_messages").delete().eq("id", msgId);
    if (error) toast.error("Failed to delete.");
  }

  return (
    <div className="card-elevated flex flex-col h-[400px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <p className="text-xs text-muted-foreground text-center py-8">Loading messages...</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-3.5 py-2 ${
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                    {msg.profile?.display_name ?? "Unknown"}
                  </p>
                )}
                <p className="text-sm break-words">{msg.content}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[9px] ${isMe ? "opacity-60" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "HH:mm")}
                  </span>
                  {isMe && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-border p-3 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-9 text-sm"
          maxLength={500}
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={sending || !newMessage.trim()} className="h-9 px-3">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
