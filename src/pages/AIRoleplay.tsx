import { motion } from "framer-motion";
import { Bot, Copy, MessageSquare, PhoneCall, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/landing/Navbar";

const prompts = [
  {
    title: "Cold Call Practice",
    icon: PhoneCall,
    description: "Simulate a first-touch cold call with a skeptical prospect.",
    prompt: `You are a mid-level marketing manager at a B2B SaaS company. I'm going to cold call you. Stay in character the entire time.

Your behavior:
- You're busy and slightly skeptical
- You don't know who I am or what my company does
- You'll give me about 60 seconds before you try to end the call
- Push back naturally — don't make it easy

After the call, break character and give me coaching feedback on:
1. My opening (did I earn attention?)
2. My questions (did I uncover anything real?)
3. My close (did I get a next step?)

Let's begin. I'll start the call.`,
  },
  {
    title: "Discovery Call Practice",
    icon: MessageSquare,
    description: "Run a discovery call where you need to uncover pain and priorities.",
    prompt: `You are the VP of Sales at a 200-person company. We have a scheduled discovery call.

Your behavior:
- You're open but busy — you want this to be efficient
- You have a real problem: your team's close rate has dropped 15% this quarter
- You won't volunteer information unless I ask good questions
- You've looked at one competitor already

After the conversation, break character and coach me on:
1. Did I ask the right questions?
2. Did I dig deep enough into the problem?
3. Did I rush to pitch too early?

I'll start the call.`,
  },
  {
    title: "Objection Handling Practice",
    icon: ShieldCheck,
    description: "Practice responding to common objections like price, timing, or competition.",
    prompt: `You are a prospect who just finished a demo of my product. You're interested but have concerns.

Pick one of these objections and commit to it:
- "The price is too high for our budget right now."
- "We're already working with [competitor]."
- "This isn't a priority for us this quarter."

Your behavior:
- Be firm but fair — don't cave easily
- If I handle the objection well, open up slightly
- If I handle it poorly, push back harder

After the conversation, break character and give me feedback on:
1. Did I acknowledge your concern?
2. Did I reframe effectively?
3. Did I move toward a next step?

Let's begin. Start with your objection.`,
  },
];

const AIRoleplayPage = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
          <div className="flex items-center gap-3 mb-4">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
              AI Roleplay Practice
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Use these prompts with any AI assistant — ChatGPT, Claude, or similar — to practice
            realistic sales conversations. Copy a prompt, paste it in, and start practicing out loud.
          </p>
          <div className="mt-6 rounded-lg bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-secondary-foreground">How it works:</span>{" "}
              Each prompt sets up a realistic scenario where the AI plays the prospect.
              After the conversation, the AI will break character and give you coaching feedback.
            </p>
          </div>
        </motion.div>

        <div className="space-y-10">
          {prompts.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-1">
                <p.icon className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {p.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 pl-8">
                {p.description}
              </p>

              <div className="relative rounded-lg bg-muted/40 p-5">
                <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider mb-3">
                  Prompt — copy and paste into ChatGPT or Claude
                </p>
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
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 rounded-lg bg-muted/40 p-6 max-w-2xl"
        >
          <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider mb-2">
            Tips for better practice
          </p>
          <ul className="space-y-2">
            {[
              "Speak your responses out loud — don't just type them.",
              "Record yourself if possible and review after.",
              "Run the same scenario multiple times with different approaches.",
              "Focus on one skill per session: opening, discovery, or objection handling.",
            ].map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default AIRoleplayPage;
