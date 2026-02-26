import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCheck, MessageSquare, Clock, ShieldCheck, PhoneCall, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";

const roles = [
  {
    id: "hiring-manager",
    title: "Calm Hiring Manager",
    description: "Professional interviewer focused on clarity and structured answers.",
    icon: UserCheck,
    systemPrompt:
      "You are a calm, professional hiring manager interviewing a sales candidate. Ask realistic interview questions. Push gently when answers are vague. Stay neutral and composed throughout the conversation. Keep responses concise (2-4 sentences). Stay in character at all times.",
  },
  {
    id: "b2b-prospect",
    title: "Neutral B2B Prospect",
    description: "Open but guarded — won't volunteer information unless asked.",
    icon: MessageSquare,
    systemPrompt:
      "You are a neutral B2B prospect. You are open to learning but skeptical of sales pitches. Answer questions honestly, but do not volunteer information unless asked clearly. Keep responses concise (2-4 sentences). Stay in character at all times.",
  },
  {
    id: "decision-maker",
    title: "Busy Decision Maker",
    description: "Short on time, impatient, cares only about outcomes.",
    icon: Clock,
    systemPrompt:
      "You are a senior decision maker with limited time. You interrupt when explanations are too long. You care about outcomes, not features. Keep responses very short (1-2 sentences). Be impatient. Stay in character at all times.",
  },
  {
    id: "skeptical-buyer",
    title: "Skeptical Buyer",
    description: "Pushes back on price, timing, and credibility.",
    icon: ShieldCheck,
    systemPrompt:
      "You are skeptical due to past bad experiences. Push back on price, timing, and credibility. Require clear reasoning to move forward. Keep responses concise (2-4 sentences). Stay in character at all times.",
  },
  {
    id: "follow-up",
    title: "Follow-Up Prospect",
    description: "Went quiet after a previous call — busy, not opposed.",
    icon: PhoneCall,
    systemPrompt:
      "You previously spoke with the rep but deprioritized the decision. You are not opposed — just busy and undecided. Respond realistically to follow-up attempts. Keep responses concise (2-4 sentences). Stay in character at all times.",
  },
];

interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`;

async function streamChat({
  messages,
  systemPrompt,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  systemPrompt: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to start stream");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // flush
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const json = raw.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const PracticePage = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRole = roles.find((r) => r.id === selectedRole);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = (id: string) => {
    setSelectedRole(id);
    setMessages([]);
    setInput("");
    setIsLoading(false);
    const role = roles.find((r) => r.id === id);
    if (role) {
      setMessages([
        { role: "prospect", text: `[${role.title}] — Ready. Begin when you are.` },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeRole || isLoading) return;
    const userText = input.trim();
    setInput("");

    const newMessages: ChatMessage[] = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    // Build history for the AI
    const aiMessages = newMessages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    let prospectText = "";

    try {
      await streamChat({
        messages: aiMessages,
        systemPrompt: activeRole.systemPrompt,
        onDelta: (chunk) => {
          prospectText += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "prospect" && prev.length === newMessages.length + 1) {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, text: prospectText } : m
              );
            }
            return [...prev, { role: "prospect", text: prospectText }];
          });
        },
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (selectedRole) handleStart(selectedRole);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-[calc(100vh-8rem)]">
          {/* LEFT COLUMN */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h2 className="font-heading text-xl font-bold text-foreground mb-5">
              Choose a Roleplay
            </h2>
            <div className="space-y-3">
              {roles.map((role) => {
                const isActive = selectedRole === role.id;
                return (
                  <div
                    key={role.id}
                    className={`card-elevated p-4 flex items-start gap-3 transition-all duration-200 ${
                      isActive ? "border-primary/60 shadow-[0_0_20px_hsl(145_72%_50%/0.1)]" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                        isActive ? "bg-primary/20" : "bg-muted"
                      }`}
                    >
                      <role.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-sm font-semibold text-foreground leading-tight">
                        {role.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="shrink-0 text-xs h-8"
                      onClick={() => handleStart(role.id)}
                    >
                      {isActive ? "Active" : "Start"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.aside>

          {/* RIGHT COLUMN */}
          <motion.main
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col card-elevated overflow-hidden"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Roleplay Chat
              </h2>
              {activeRole && (
                <span className="text-xs text-muted-foreground">
                  Practicing with: <span className="text-foreground font-medium">{activeRole.title}</span>
                </span>
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]">
              {!selectedRole && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Select a roleplay character to begin practicing.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={
                    msg.role === "user"
                      ? { opacity: 0, scale: 0.9, x: 20 }
                      : { opacity: 0, scale: 0.95, x: -12 }
                  }
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                    className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.text}
                  </motion.div>
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-2 w-2 rounded-full bg-muted-foreground/60"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response…"
                  disabled={!selectedRole || isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!selectedRole || !input.trim() || isLoading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={handleReset} disabled={!selectedRole}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            </div>
          </motion.main>
        </div>

        {/* Bottom Helper */}
        <p className="mt-8 text-center text-sm text-muted-foreground/70">
          Practice out loud. Keep it natural. Ask questions. Drive toward a next step.
        </p>
      </div>
    </div>
  );
};

export default PracticePage;
