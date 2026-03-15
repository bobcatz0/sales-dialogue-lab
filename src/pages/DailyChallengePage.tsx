import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Clock, Sparkles, Check, Trophy,
  RotateCcw, Send, Loader2, Calendar, StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/landing/Navbar";
import {
  getTodayChallenge,
  getTodayChallengeId,
  checkChallengeCondition,
  markChallengeCompleted,
  CHALLENGE_BONUS_POINTS,
} from "@/components/practice/dailyChallenge";
import {
  recordChallengeAttempt,
  computeChallengeResult,
  type ChallengeResult,
} from "@/lib/challengeScores";
import { roles } from "@/components/practice/roleData";
import { ENVIRONMENTS } from "@/components/practice/environments";
import { cleanResponseText } from "@/components/practice/pressureEngine";
import { track } from "@/lib/analytics";
import type { ChatMessage, Feedback } from "@/components/practice/types";

// ── API constants ───────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`;
const FEEDBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-feedback`;

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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) onDelta(chunk);
      } catch { /* skip malformed chunks */ }
    }
  }
  onDone();
}

// ── Neutral AI label per environment ───────────────────────────
const AI_LABEL: Record<string, string> = {
  "cold-call": "Prospect",
  "interview": "Interviewer",
  "enterprise": "Evaluator",
  "final-round": "Interviewer",
};

type Phase = "intro" | "session" | "result";

// ── Delta score chip ────────────────────────────────────────────
function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const positive = delta >= 0;
  return (
    <span className={`text-sm font-bold ${positive ? "text-primary" : "text-destructive"}`}>
      {positive ? "+" : ""}{delta}
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────
export default function DailyChallengePage() {
  const navigate = useNavigate();
  const { challenge, completed: initiallyCompleted } = getTodayChallenge();
  const env = ENVIRONMENTS.find((e) => e.id === challenge.environmentId);
  const persona = roles.find((r) => r.id === challenge.personaId);

  const [phase, setPhase] = useState<Phase>("intro");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [conditionMet, setConditionMet] = useState(false);

  const sessionStartRef = useRef<number>(0);
  const sendingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const aiLabel = AI_LABEL[challenge.environmentId] ?? "Interviewer";

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBegin = () => {
    track("challenge_started", {
      personaId: challenge.personaId,
      environmentId: challenge.environmentId,
      date: challenge.date,
    });
    sessionStartRef.current = Date.now();
    setPhase("session");
    setMessages([{ role: "prospect", text: "Ready. Begin when you are." }]);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || sendingRef.current || !persona || !env) return;
    sendingRef.current = true;

    const newMessages: ChatMessage[] = [...messages, { role: "user", text: text.trim() }];
    setMessages(newMessages);
    setIsLoading(true);

    const aiMessages = newMessages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const systemPrompt =
      persona.systemPrompt + (env.promptAddendum ? `\n\n${env.promptAddendum}` : "");

    let prospectText = "";
    try {
      await streamChat({
        messages: aiMessages,
        systemPrompt,
        onDelta: (chunk) => {
          prospectText += chunk;
          const displayText = cleanResponseText(prospectText);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "prospect" && prev.length === newMessages.length + 1) {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, text: displayText } : m
              );
            }
            return [...prev, { role: "prospect", text: displayText }];
          });
        },
        onDone: () => {
          setIsLoading(false);
          sendingRef.current = false;
        },
      });
    } catch {
      setIsLoading(false);
      sendingRef.current = false;
    }
  }, [messages, isLoading, persona, env]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await sendMessage(text);
  };

  const handleEnd = async () => {
    const userMsgCount = messages.filter((m) => m.role === "user").length;
    if (userMsgCount < 2) return;

    setPhase("result");
    setIsFeedbackLoading(true);

    try {
      const resp = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages,
          roleTitle: challenge.skillFocus,
          environmentId: challenge.environmentId,
        }),
      });

      if (!resp.ok) throw new Error("Feedback failed");
      const data: Feedback = await resp.json();
      setFeedback(data);

      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const met = checkChallengeCondition(challenge.conditionKey, {
        score: data.score,
        peakDifficulty: data.peakDifficulty ?? 1,
        userMessageCount: userMsgCount,
        durationSeconds,
        hardCloseWin: false,
      });

      const key = getTodayChallengeId();
      recordChallengeAttempt(key, data.score, met);
      setChallengeResult(computeChallengeResult(key, data.score));
      setConditionMet(met);

      if (met) {
        markChallengeCompleted();
        track("challenge_completed", {
          score: data.score,
          personaId: challenge.personaId,
          environmentId: challenge.environmentId,
          skillFocus: challenge.skillFocus,
        });
      }
    } catch {
      // keep result phase showing — user sees partial state
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const handleRetry = () => {
    track("challenge_retried", {
      personaId: challenge.personaId,
      environmentId: challenge.environmentId,
    });
    setPhase("intro");
    setMessages([]);
    setInput("");
    setFeedback(null);
    setChallengeResult(null);
    setConditionMet(false);
  };

  const hasEnoughMessages = messages.filter((m) => m.role === "user").length >= 2;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-16 max-w-2xl">
        <AnimatePresence mode="wait">

          {/* ── Intro ── */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Label */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Daily Challenge
                </span>
              </div>

              {/* Challenge card */}
              <div className="card-elevated p-6 space-y-4">
                <h1 className="font-heading text-2xl font-bold text-foreground leading-tight">
                  {challenge.skillFocus}
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {challenge.successLabel}
                </p>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {challenge.estimatedTime}
                  </span>
                  {challenge.beginnerFriendly && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      <Sparkles className="h-3.5 w-3.5" />
                      Beginner Friendly
                    </span>
                  )}
                </div>

                <div className="border-t border-border pt-4 flex items-center gap-5 text-sm">
                  <span className="text-muted-foreground">
                    Avg&nbsp;
                    <span className="font-semibold text-foreground">{challenge.avgBenchmark}</span>
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground">
                    Top&nbsp;
                    <span className="font-semibold text-foreground">{challenge.topBenchmark}</span>
                  </span>
                </div>
              </div>

              {initiallyCompleted && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  You've completed today's challenge. Replay for more practice.
                </div>
              )}

              <Button size="lg" className="w-full gap-2" onClick={handleBegin}>
                {initiallyCompleted ? "Replay Challenge" : "Begin Challenge"}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <button
                onClick={() => navigate("/practice")}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                ← Full Practice Mode
              </button>
            </motion.div>
          )}

          {/* ── Session ── */}
          {phase === "session" && (
            <motion.div
              key="session"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{challenge.skillFocus}</span>
                <span className="ml-auto text-xs text-muted-foreground">{challenge.estimatedTime}</span>
              </div>

              <div className="card-elevated flex flex-col overflow-hidden" style={{ minHeight: "480px" }}>
                {/* Chat header — neutral label only */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {aiLabel} · {challenge.skillFocus}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={handleEnd}
                    disabled={!hasEnoughMessages || isLoading || isFeedbackLoading}
                  >
                    <StopCircle className="h-3 w-3" />
                    End Session
                  </Button>
                </div>

                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                >
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl px-3.5 py-2.5 flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-border p-3 space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type your response…"
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
                  {!hasEnoughMessages && (
                    <p className="text-[10px] text-muted-foreground">
                      Exchange at least 2 messages before ending.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Result ── */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Result</span>
              </div>

              {/* Loading state */}
              {isFeedbackLoading && (
                <div className="card-elevated p-10 flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Scoring your session…</span>
                </div>
              )}

              {/* Score card */}
              {feedback && !isFeedbackLoading && (
                <>
                  <div className="card-elevated p-6 space-y-5">
                    {/* Score + icon */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                          Your Score
                        </p>
                        <p className="font-heading text-5xl font-bold text-foreground leading-none">
                          {feedback.score}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{feedback.rank}</p>
                      </div>
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                        conditionMet ? "bg-primary/15" : "bg-muted"
                      }`}>
                        {conditionMet
                          ? <Trophy className="h-7 w-7 text-primary" />
                          : <span className="text-3xl">📊</span>
                        }
                      </div>
                    </div>

                    {/* Goal status */}
                    {conditionMet ? (
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Check className="h-4 w-4 shrink-0" />
                        Goal met — {challenge.successLabel} · +{CHALLENGE_BONUS_POINTS} pts
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Goal: {challenge.successLabel}
                      </p>
                    )}

                    {/* Comparison row */}
                    <div className="border-t border-border pt-4 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          This Run
                        </p>
                        <p className="text-xl font-bold font-heading text-foreground">
                          {feedback.score}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          {challengeResult?.previousScore !== null ? "vs Last" : "Avg"}
                        </p>
                        <p className="text-xl font-bold font-heading text-foreground">
                          {challengeResult?.previousScore !== null
                            ? <DeltaChip delta={challengeResult?.delta ?? null} />
                            : challenge.avgBenchmark
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Top
                        </p>
                        <p className="text-xl font-bold font-heading text-foreground">
                          {challenge.topBenchmark}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Best moment / next drill */}
                  {(feedback.bestMoment || feedback.nextDrill) && (
                    <div className="card-elevated p-4 space-y-2">
                      {feedback.bestMoment && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                            Best Moment
                          </p>
                          <p className="text-xs text-foreground leading-relaxed">{feedback.bestMoment}</p>
                        </div>
                      )}
                      {feedback.nextDrill && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                            To Improve
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feedback.nextDrill}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-1">
                    <Button variant="outline" size="lg" className="w-full gap-2" onClick={handleRetry}>
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                    <Button size="lg" className="w-full gap-2" onClick={() => navigate("/practice")}>
                      Full Practice Mode
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
