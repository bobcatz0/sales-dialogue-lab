import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, StopCircle, Loader2, Flame, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";

import { roles } from "@/components/practice/roleData";
import type { ChatMessage, Feedback, SessionRecord } from "@/components/practice/types";
import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import { SessionHistory } from "@/components/practice/SessionHistory";
import { loadHistory, saveSession } from "@/components/practice/sessionStorage";
import { VoiceInputButton } from "@/components/practice/VoiceInputButton";
import { processSession, loadConsistency } from "@/components/practice/consistencyScoring";
import {
  loadProgression,
  isPersonaUnlocked,
  getRank,
  updateProgression,
  getUnlockHint,
} from "@/components/practice/progression";
import { UnlockModal } from "@/components/practice/UnlockModal";
import { Badge } from "@/components/ui/badge";
import {
  loadAlias,
  loadEarnedBadges,
  evaluateBadges,
  BADGE_DEFINITIONS,
} from "@/components/practice/achievements";
import { AliasPrompt } from "@/components/practice/AliasPrompt";
import { BadgeUnlockModal } from "@/components/practice/BadgeUnlockModal";
import { ProfilePanel } from "@/components/practice/ProfilePanel";
import { buildPressurePrompt, detectCallEnd, detectHardCloseWin, cleanResponseText } from "@/components/practice/pressureEngine";
import { useCallTimer } from "@/components/practice/CallTimer";
import { ENVIRONMENTS, getEnvironment, type EnvironmentId } from "@/components/practice/environments";
import { getTodayChallenge, checkChallengeCondition, markChallengeCompleted, CHALLENGE_BONUS_POINTS } from "@/components/practice/dailyChallenge";
import { DailyChallengeCard } from "@/components/practice/DailyChallengeCard";


// --- Streaming ---

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

// --- Page ---

const PracticePage = () => {
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentId | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [progression, setProgression] = useState(() => loadProgression());
  const [unlockQueue, setUnlockQueue] = useState<{ id: string; label: string; description: string }[]>([]);
  const [alias, setAlias] = useState<string | null>(() => loadAlias());
  const [showAliasPrompt, setShowAliasPrompt] = useState(false);
  const [badgeQueue, setBadgeQueue] = useState<string[]>([]);
  const [hardCloseWin, setHardCloseWin] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(() => getTodayChallenge().completed);
  const [sessionActive, setSessionActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const elapsedRef = useRef(0);
  const callEndTriggeredRef = useRef(false);

  const timer = useCallTimer(sessionActive);

  const activeEnv = selectedEnv ? getEnvironment(selectedEnv) : undefined;
  const activeRole = roles.find((r) => r.id === selectedRole);
  const consistencyData = loadConsistency();
  const currentRank = getRank(consistencyData.score);
  const filteredRoles = activeEnv
    ? roles.filter((r) => activeEnv.personaIds.includes(r.id))
    : [];

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

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
    setFeedback(null);
    setIsFeedbackLoading(false);
    setLastPoints(null);
    setHardCloseWin(false);
    callEndTriggeredRef.current = false;
    sessionStartRef.current = Date.now();
    setSessionActive(true);
    const role = roles.find((r) => r.id === id);
    if (role) {
      setMessages([
        { role: "prospect", text: `[${role.title}] — Ready. Begin when you are.` },
      ]);
    }
  };

  const handleStartChallenge = (envId: EnvironmentId, personaId: string) => {
    setSelectedEnv(envId);
    handleStart(personaId);
  };

  const sendingRef = useRef(false);

  const handleSend = async () => {
    if (!input.trim() || !activeRole || isLoading || sendingRef.current || callEndTriggeredRef.current) return;
    sendingRef.current = true;
    const userText = input.trim();
    setInput("");

    const newMessages: ChatMessage[] = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    const aiMessages = newMessages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    // Build dynamic system prompt with pressure + environment
    const userMsgCount = newMessages.filter((m) => m.role === "user").length;
    const pressureAddendum = buildPressurePrompt({
      elapsedSeconds: timer.elapsed,
      userMessageCount: userMsgCount,
      totalValidSessions: loadProgression().completedValidSessions,
      timePressureThresholdS: activeEnv?.timePressureThresholdS,
      callEndingEnabled: activeEnv?.callEndingEnabled,
    });
    const envAddendum = activeEnv?.promptAddendum ? `\n\n${activeEnv.promptAddendum}` : "";
    const fullSystemPrompt = activeRole.systemPrompt + envAddendum + pressureAddendum;

    let prospectText = "";

    try {
      await streamChat({
        messages: aiMessages,
        systemPrompt: fullSystemPrompt,
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

          // Check for hard close win
          if (detectHardCloseWin(prospectText)) {
            setHardCloseWin(true);
            toast("Successful next-step commitment detected.", { duration: 3000 });
          }

          // Check for persona-initiated call end
          if (detectCallEnd(prospectText) && !callEndTriggeredRef.current) {
            callEndTriggeredRef.current = true;
            setSessionActive(false);
            setTimeout(() => {
              handleEndSession();
            }, 1500);
          }
        },
      });
    } catch (e: any) {
      console.error(e);
      sendingRef.current = false;
      toast.error("Connection issue. Please try again.", { duration: 3000 });
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (!selectedRole || !activeRole) return;
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setFeedback(null);
    setIsFeedbackLoading(false);
    setHardCloseWin(false);
    callEndTriggeredRef.current = false;
    setSessionActive(true);
    
    setMessages([
      { role: "prospect", text: `[${activeRole.title}] — Ready. Begin when you are.` },
    ]);
  };

  const handleEndSession = useCallback(async () => {
    if (!activeRole) return;
    setSessionActive(false);
    const conversationMessages = [...messages];
    const userMsgCount = conversationMessages.filter((m) => m.role === "user").length;

    if (userMsgCount < 2) {
      toast.error("Complete at least 2 exchanges before ending the session.");
      return;
    }

    setIsFeedbackLoading(true);

    try {
      const resp = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationMessages,
          roleTitle: activeRole.title,
          environmentId: selectedEnv,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Feedback failed" }));
        throw new Error(err.error || "Failed to get feedback");
      }

      const data: Feedback = await resp.json();
      setFeedback(data);

      // Save to history
      const session: SessionRecord = {
        id: crypto.randomUUID(),
        roleId: activeRole.id,
        roleTitle: activeRole.title,
        score: data.score,
        rank: data.rank,
        peakDifficulty: data.peakDifficulty ?? 1,
        date: new Date().toISOString(),
        messageCount: conversationMessages.length,
      };
      const updated = saveSession(session);
      setHistory(updated);

      // Process consistency scoring
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const recentScores = updated.slice(1, 6).map((s) => s.score); // previous 5
      const isValidSession = durationSeconds >= 90 && userMsgCount >= 6;
      const { points } = processSession({
        roleId: activeRole.id,
        sessionScore: data.score,
        userMessageCount: userMsgCount,
        durationSeconds,
        recentScores,
      });
      // Hard close bonus
      const finalPoints = hardCloseWin ? points + 20 : points;
      setLastPoints(finalPoints);

      // Update progression & check unlocks
      const { newUnlocks, data: progData } = updateProgression({
        sessionScore: data.score,
        peakDifficulty: data.peakDifficulty ?? 1,
        isValidSession,
      });
      setProgression(progData);
      if (newUnlocks.length > 0) {
        setUnlockQueue(newUnlocks);
      }

      // Evaluate badges
      const updatedConsistency = loadConsistency();
      const newBadges = evaluateBadges({
        roleId: activeRole.id,
        sessionScore: data.score,
        peakDifficulty: data.peakDifficulty ?? 1,
        currentStreak: updatedConsistency.currentStreak,
        totalValidSessions: updatedConsistency.totalSessions,
        isValidSession,
      });
      if (newBadges.length > 0) {
        setBadgeQueue(newBadges);
      }

      // Daily Challenge completion check
      if (isValidSession && !challengeCompleted && activeRole) {
        const todayChallenge = getTodayChallenge();
        if (
          todayChallenge.challenge.environmentId === selectedEnv &&
          todayChallenge.challenge.personaId === activeRole.id &&
          checkChallengeCondition(todayChallenge.challenge.conditionKey, {
            score: data.score,
            peakDifficulty: data.peakDifficulty ?? 1,
            userMessageCount: userMsgCount,
            durationSeconds,
            hardCloseWin,
          })
        ) {
          markChallengeCompleted();
          setChallengeCompleted(true);
          toast("Daily training objective completed. +${CHALLENGE_BONUS_POINTS} pts", { duration: 3000 });
        }
      }

      // Prompt alias on first valid session completion
      if (isValidSession && !loadAlias()) {
        setShowAliasPrompt(true);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Connection issue. Please try again.", { duration: 3000 });
    } finally {
      setIsFeedbackLoading(false);
    }
  }, [activeRole, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasEnoughMessages = messages.filter((m) => m.role === "user").length >= 2;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 min-h-[calc(100vh-8rem)]">
          {/* LEFT COLUMN */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Step 1: Environment Selection */}
            {!selectedEnv && (
              <div>
                {/* Professional framing */}
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                  Structured training simulator for clarity, objection handling, and conversational control in professional sales environments.
                </p>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-sm font-bold text-foreground">
                    Training Mode
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-medium border-border text-muted-foreground">
                    {currentRank}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {ENVIRONMENTS.map((env) => (
                    <motion.div
                      key={env.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedEnv(env.id)}
                      className="card-elevated p-4 flex items-start gap-3 cursor-pointer transition-all duration-200 hover:border-primary/40"
                    >
                      <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center">
                        <env.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-heading text-sm font-semibold text-foreground leading-tight">
                            {env.title}
                          </h3>
                          {env.id === "interview" && (
                            <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              Recommended for job seekers
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium">{env.subtitle}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {env.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Persona Selection (after environment chosen) */}
            {selectedEnv && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => {
                      setSelectedEnv(null);
                      setSelectedRole(null);
                      setMessages([]);
                      setFeedback(null);
                      setSessionActive(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading text-sm font-bold text-foreground truncate">
                      {activeEnv?.title}
                    </h2>
                    <p className="text-[10px] text-muted-foreground">{activeEnv?.subtitle}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium border-border text-muted-foreground shrink-0">
                    {currentRank}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {filteredRoles.map((role) => {
                    const isActive = selectedRole === role.id;
                    const unlocked = isPersonaUnlocked(role.id, progression);
                    const hint = !unlocked ? getUnlockHint(role.id, progression) : null;
                    return (
                      <div
                        key={role.id}
                        className={`card-elevated p-4 flex items-start gap-3 transition-all duration-200 ${
                          isActive
                            ? "border-primary/60 shadow-[0_0_20px_hsl(145_72%_50%/0.1)]"
                            : !unlocked
                            ? "opacity-60"
                            : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                            !unlocked ? "bg-muted" : isActive ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          {unlocked ? (
                            <role.icon
                              className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                            />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-sm font-semibold text-foreground leading-tight">
                            {role.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {unlocked ? role.description : hint}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          className="shrink-0 text-xs h-8"
                          onClick={() => unlocked && handleStart(role.id)}
                          disabled={!unlocked}
                        >
                          {!unlocked ? "Locked" : isActive ? "Active" : "Start"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Challenge */}
            <DailyChallengeCard onStart={handleStartChallenge} />

            {/* Profile Panel */}
            {alias && (
              <ProfilePanel alias={alias} consistency={loadConsistency()} />
            )}

            {/* Session History — below roles on left column */}
            <SessionHistory
              sessions={history}
              onClear={() => setHistory([])}
            />
          </motion.aside>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4 min-w-0">
            <motion.main
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col card-elevated overflow-hidden flex-1"
            >
              {/* Chat Header — compact */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  {activeEnv && (
                    <Badge variant="secondary" className="text-[10px] font-medium shrink-0">
                      {activeEnv.title}
                    </Badge>
                  )}
                  {activeRole && (
                    <span className="text-xs font-medium text-foreground truncate">
                      {activeRole.title}
                    </span>
                  )}
                  {!activeRole && !activeEnv && (
                    <span className="text-xs text-muted-foreground">Roleplay</span>
                  )}
                </div>
                {sessionActive && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums font-mono shrink-0">
                    <span className="inline-block h-1 w-1 rounded-full bg-primary/70" />
                    {timer.display}
                  </span>
                )}
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[250px] sm:min-h-[350px]"
              >
                {!selectedRole && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground text-center">
                      {!selectedEnv
                        ? "Choose an environment to start."
                        : "Select a persona to begin."}
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
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
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area — mobile-optimized */}
              <div className="border-t border-border p-3 sm:p-4">
                <div className="flex gap-1.5 sm:gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type…"
                    disabled={!selectedRole || isLoading}
                    className="flex-1 h-9 text-sm"
                  />
                  <VoiceInputButton
                    onTranscript={(text) => setInput((prev) => (prev ? prev + " " + text : text))}
                    disabled={!selectedRole || isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!selectedRole || !input.trim() || isLoading}
                    size="icon"
                    className="h-9 w-9 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-1.5 sm:gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 text-muted-foreground"
                    onClick={handleReset}
                    disabled={!selectedRole || isLoading}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={handleEndSession}
                    disabled={
                      !selectedRole || isLoading || isFeedbackLoading || !hasEnoughMessages
                    }
                  >
                    <StopCircle className="h-3 w-3 mr-1" />
                    End Session
                  </Button>
                </div>
              </div>
            </motion.main>

            {/* Feedback Section */}
            <AnimatePresence>
              {isFeedbackLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="card-elevated p-5 flex items-center justify-center gap-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Analyzing…</span>
                </motion.div>
              )}
              {feedback && !isFeedbackLoading && (
                <>
                  {lastPoints !== null && lastPoints > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="card-elevated px-4 py-2.5 flex items-center gap-2 text-xs"
                    >
                      <Flame className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-primary">+{lastPoints}</span>
                    </motion.div>
                  )}
                  <FeedbackPanel
                    feedback={feedback}
                    onStartNew={() => {
                      setFeedback(null);
                      setSelectedRole(null);
                      setSelectedEnv(null);
                      setMessages([]);
                      setInput("");
                      setLastPoints(null);
                    }}
                    onTrySameRole={() => {
                      setFeedback(null);
                      setLastPoints(null);
                      if (selectedRole) handleStart(selectedRole);
                    }}
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Unlock Modal */}
      <UnlockModal
        open={unlockQueue.length > 0}
        personaName={unlockQueue[0]?.label ?? ""}
        personaDescription={unlockQueue[0]?.description ?? ""}
        onClose={() => setUnlockQueue((q) => q.slice(1))}
      />

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal
        open={badgeQueue.length > 0}
        badge={BADGE_DEFINITIONS.find((b) => b.id === badgeQueue[0]) ?? null}
        onClose={() => setBadgeQueue((q) => q.slice(1))}
      />

      {/* Alias Prompt */}
      <AliasPrompt
        open={showAliasPrompt}
        onComplete={(a) => {
          setAlias(a);
          setShowAliasPrompt(false);
        }}
      />
    </div>
  );
};

export default PracticePage;
