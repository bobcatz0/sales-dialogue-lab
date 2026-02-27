import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Send, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Drill } from "./drillData";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`;

interface DrillModeProps {
  drill: Drill;
  onComplete: () => void;
  onDismiss: () => void;
}

interface DrillMessage {
  role: "system" | "user";
  text: string;
}

export function DrillMode({ drill, onComplete, onDismiss }: DrillModeProps) {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [messages, setMessages] = useState<DrillMessage[]>([
    { role: "system", text: `${drill.prompts[0].instruction}\n\n"${drill.prompts[0].scenario}"` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const sendingRef = useRef(false);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || sendingRef.current) return;
    sendingRef.current = true;
    const userText = input.trim();
    setInput("");

    const newMessages: DrillMessage[] = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiMessages = newMessages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const nextPromptIdx = currentPrompt + 1;
      const hasNext = nextPromptIdx < drill.prompts.length;

      // Include next scenario in system prompt so AI transitions
      const systemWithNext = hasNext
        ? `${drill.systemPrompt}\n\nAfter evaluating this response, present the next scenario:\nInstruction: ${drill.prompts[nextPromptIdx].instruction}\nScenario: "${drill.prompts[nextPromptIdx].scenario}"`
        : `${drill.systemPrompt}\n\nThis is the final prompt. After evaluating, say exactly: "Drill complete." Nothing else.`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: aiMessages,
          systemPrompt: systemWithNext,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Request failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let responseText = "";
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
            if (content) {
              responseText += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "system" && prev.length === newMessages.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, text: responseText } : m);
                }
                return [...prev, { role: "system", text: responseText }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (hasNext) {
        setCurrentPrompt(nextPromptIdx);
      } else {
        setCompleted(true);
      }
    } catch {
      toast.error("Connection issue. Try again.");
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  }, [input, isLoading, messages, currentPrompt, drill]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="card-elevated overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-destructive" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {drill.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {drill.prompts.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i < currentPrompt ? "bg-primary" : i === currentPrompt ? "bg-foreground" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Directive */}
      <div className="px-5 py-3 border-b border-border bg-muted/30">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Directive:</span> {drill.directive}
        </p>
      </div>

      {/* Messages */}
      <div className="px-5 py-4 space-y-3 max-h-[300px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3.5 py-2.5 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input or Completion */}
      {!completed ? (
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type…"
              disabled={isLoading}
              className="flex-1 h-9 text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-[10px] text-muted-foreground h-7"
            onClick={onDismiss}
          >
            Skip drill
          </Button>
        </div>
      ) : (
        <div className="border-t border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Skill sharpened. Reattempt Interview Simulation.
            </p>
          </div>
          <Button size="sm" className="w-full h-9" onClick={onComplete}>
            <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
            Reattempt Interview
          </Button>
        </div>
      )}
    </motion.div>
  );
}
