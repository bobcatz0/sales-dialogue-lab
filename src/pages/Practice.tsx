import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCheck, MessageSquare, Clock, ShieldCheck, PhoneCall, Send, RotateCcw, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/landing/Navbar";

const roles = [
  {
    id: "hiring-manager",
    title: "Calm Hiring Manager",
    description: "Professional interviewer focused on clarity and structured answers.",
    icon: UserCheck,
    systemPrompt: "You are a calm, professional hiring manager interviewing a sales candidate.",
  },
  {
    id: "b2b-prospect",
    title: "Neutral B2B Prospect",
    description: "Open but guarded — won't volunteer information unless asked.",
    icon: MessageSquare,
    systemPrompt: "You are a neutral B2B prospect, open to learning but skeptical of pitches.",
  },
  {
    id: "decision-maker",
    title: "Busy Decision Maker",
    description: "Short on time, impatient, cares only about outcomes.",
    icon: Clock,
    systemPrompt: "You are a senior decision maker with limited time who interrupts long explanations.",
  },
  {
    id: "skeptical-buyer",
    title: "Skeptical Buyer",
    description: "Pushes back on price, timing, and credibility.",
    icon: ShieldCheck,
    systemPrompt: "You are skeptical due to past bad experiences. Push back on everything.",
  },
  {
    id: "follow-up",
    title: "Follow-Up Prospect",
    description: "Went quiet after a previous call — busy, not opposed.",
    icon: PhoneCall,
    systemPrompt: "You previously spoke with the rep but deprioritized the decision.",
  },
];

interface ChatMessage {
  role: "user" | "prospect";
  text: string;
}

const PracticePage = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [userSide, setUserSide] = useState<"user" | "prospect">("user");
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
    setUserSide("user");
    const role = roles.find((r) => r.id === id);
    if (role) {
      setMessages([
        { role: "prospect", text: `[${role.title}] — Ready. Begin when you are.` },
      ]);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !selectedRole) return;
    setMessages((prev) => [...prev, { role: userSide, text: input.trim() }]);
    setInput("");
  };

  const handleReset = () => {
    if (selectedRole) handleStart(selectedRole);
  };

  const handleSwitchRole = () => {
    setUserSide((prev) => (prev === "user" ? "prospect" : "user"));
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
                  Speaking as: <span className="text-foreground font-medium">{userSide === "user" ? "Sales Rep" : "Prospect"}</span>
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response…"
                  disabled={!selectedRole}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!selectedRole || !input.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={handleReset} disabled={!selectedRole}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={handleSwitchRole} disabled={!selectedRole}>
                  <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                  Switch Role
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
