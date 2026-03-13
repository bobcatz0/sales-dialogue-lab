import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageSquare, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROMPTS = [
  {
    scenario: "Cold Call — SaaS VP of Sales",
    question:
      "You just got the VP of Sales at a mid-market company on the phone. They say: \"I'm not interested, we already have a solution.\" How do you respond?",
    env: "cold-call",
    role: "b2b-prospect",
  },
  {
    scenario: "Discovery Call — Enterprise CTO",
    question:
      "The CTO asks: \"Why should I disrupt our current workflow for your platform?\" What do you say to keep the conversation going?",
    env: "discovery",
    role: "prospect",
  },
  {
    scenario: "SDR Interview — Hiring Manager",
    question:
      "The hiring manager says: \"Walk me through how you'd book 5 meetings this week starting from scratch.\" Give your answer.",
    env: "interview",
    role: "hiring-manager",
  },
];

export default function InterviewPrompt() {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const prompt = PROMPTS[promptIndex];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      navigate(`/practice?env=${prompt.env}&role=${prompt.role}`);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Section label */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Mic className="h-3.5 w-3.5" />
              Try it now
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2">
              Can you handle this?
            </h2>
          </div>

          {/* Interview card */}
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3 }}
                className="card-elevated overflow-hidden"
              >
                {/* Scenario tag */}
                <div className="px-5 pt-5 pb-0">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                    {prompt.scenario}
                  </span>
                </div>

                {/* Question bubble */}
                <div className="px-5 pt-4 pb-2">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 flex-1">
                      <p className="text-sm text-foreground leading-relaxed">
                        {prompt.question}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Answer area */}
                <div className="px-5 pb-5 pt-3">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your response…"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[10px] text-muted-foreground">
                        Press Enter to submit · Shift+Enter for new line
                      </p>
                      <Button
                        variant="hero"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={handleSubmit}
                        disabled={!answer.trim()}
                      >
                        Answer
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="transition"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
                className="card-elevated p-10 text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
                  className="h-14 w-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto"
                >
                  <ArrowRight className="h-6 w-6 text-primary" />
                </motion.div>
                <p className="font-heading text-lg font-bold text-foreground">
                  Good start — let's see the full answer.
                </p>
                <p className="text-sm text-muted-foreground">
                  Loading your interview session…
                </p>
                {/* Pulse dots */}
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
