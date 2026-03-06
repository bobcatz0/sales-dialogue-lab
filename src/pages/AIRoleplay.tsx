import { motion } from "framer-motion";
import { Copy, UserCheck, MessageSquare, ShieldCheck, Clock, PhoneCall, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";

const prompts = [
  {
    title: "Roleplay: Calm Hiring Manager",
    icon: UserCheck,
    prompt: `You are a calm, professional hiring manager interviewing a sales candidate.

Ask realistic interview questions.

Push gently when answers are vague.

Stay neutral and composed throughout the conversation.`,
  },
  {
    title: "Roleplay: Neutral B2B Prospect (Discovery Call)",
    icon: MessageSquare,
    prompt: `You are a neutral B2B prospect.

You are open to learning but skeptical of sales pitches.

Answer questions honestly, but do not volunteer information unless asked clearly.`,
  },
  {
    title: "Roleplay: Busy Decision Maker",
    icon: Clock,
    prompt: `You are a senior decision maker with limited time.

You interrupt when explanations are too long.

You care about outcomes, not features.`,
  },
  {
    title: "Roleplay: Skeptical Buyer",
    icon: ShieldCheck,
    prompt: `You are skeptical due to past bad experiences.

Push back on price, timing, and credibility.

Require clear reasoning to move forward.`,
  },
  {
    title: "Roleplay: Follow-Up Prospect",
    icon: PhoneCall,
    prompt: `You previously spoke with the rep but deprioritized the decision.

You are not opposed — just busy and undecided.

Respond realistically to follow-up attempts.`,
  },
];

const AIRoleplayPage = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-16"
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
            Free Sales Call Roleplay Scenarios
          </h1>
          <div className="mt-4 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Practice real sales conversations using structured roleplay
              personalities.
            </p>
            <p>
              These scenarios are designed to simulate realistic calls —
              interviews, discovery conversations, objections, and follow-ups —
              without scripts or memorization.
            </p>
            <p>
              The goal is to help you think on your feet, stay calm, and
              communicate clearly in real situations.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="max-w-2xl mb-16"
        >
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
            How to Practice
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>Choose a roleplay scenario below</li>
            <li>Respond out loud as if you're on a real call</li>
            <li>
              Focus on clarity, tone, and direction — not perfect wording
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            You can practice:
          </p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>Alone</li>
            <li>With a partner</li>
            <li>
              Or using an AI tool to play the other side of the conversation
            </li>
          </ul>
        </motion.div>

        <div className="space-y-10">
          {prompts.map((p, i) => (
            <motion.div
              key={p.title}
              id={`roleplay-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <p.icon className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {p.title}
                </h2>
              </div>

              <div className="relative rounded-lg bg-muted/40 p-5">
                <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                  {p.prompt}
                </pre>
                <button
                  onClick={() => handleCopy(p.prompt, i)}
                  className="absolute top-4 right-4 flex items-center gap-1.5 rounded-md bg-background/80 border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedIndex === i ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="mt-6 rounded-lg bg-primary/5 border border-primary/10 p-5 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-foreground">
                  Ready to practice? Try this scenario in the AI simulator.
                </p>
                <button
                  onClick={() => navigate(`/practice?scenario=${encodeURIComponent(p.title)}`)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
                >
                  Practice This Scenario
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-20"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
            Choose a Sales Roleplay
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Pick a personality and start practicing immediately.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {prompts.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="group card-elevated p-6 flex flex-col items-center text-center hover:border-primary/40 transition-all duration-300 cursor-pointer"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                  {p.title.replace("Roleplay: ", "")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                  {p.prompt.split("\n\n")[0]}
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById(`roleplay-${i}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="mt-auto inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Start Practice
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="mt-16 max-w-xl text-sm text-muted-foreground/70 leading-relaxed">
          <p>
            These scenarios are free to use and designed to work with any
            practice method.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIRoleplayPage;
