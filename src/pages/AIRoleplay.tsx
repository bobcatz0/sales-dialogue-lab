import { motion } from "framer-motion";
import { Bot, Copy, PhoneCall, MessageSquare, ShieldCheck, UserCheck, Handshake } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/landing/Navbar";

const prompts = [
  {
    title: "Cold Call — First Contact",
    icon: PhoneCall,
    whenToUse: "Use this when you want to practice earning attention in the first 30 seconds of a cold call.",
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
    title: "Discovery Call — Uncovering Pain",
    icon: MessageSquare,
    whenToUse: "Use this when you want to practice asking better questions and going deeper on the prospect's real problem.",
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
    title: "Objection Handling — Budget Pushback",
    icon: ShieldCheck,
    whenToUse: "Use this when you want to practice staying calm and reframing when a prospect pushes back on price, timing, or competition.",
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
  {
    title: "Follow-Up Call — Re-Engaging a Prospect",
    icon: UserCheck,
    whenToUse: "Use this when you want to practice following up with a prospect who went quiet after an initial conversation.",
    prompt: `You are a director of operations at a mid-market company. We spoke two weeks ago and you seemed interested, but you stopped responding to emails.

Your behavior:
- You're not upset — you just got busy and deprioritized this
- You still have the problem we discussed, but it's not top-of-mind
- If I give you a good reason to re-engage, you'll consider it
- If I'm pushy or guilt-trip you, you'll shut down

After the conversation, break character and give me feedback on:
1. Did I re-establish context without being awkward?
2. Did I give you a reason to care again?
3. Did I secure a concrete next step?

I'll start the call.`,
  },
  {
    title: "Closing Call — Asking for the Decision",
    icon: Handshake,
    whenToUse: "Use this when you want to practice navigating the final conversation and confidently asking for a commitment.",
    prompt: `You are the decision-maker at a company that has been evaluating my solution for three weeks. You've seen a demo, spoken with references, and have budget approval in principle.

Your behavior:
- You're 80% ready to move forward but need one more push
- You have a lingering concern (you choose what it is)
- If I address it well, you'll commit
- If I'm vague or avoid it, you'll delay the decision

After the conversation, break character and give me feedback on:
1. Did I summarize the value clearly?
2. Did I handle the final concern?
3. Did I ask for the close confidently?

I'll start the call.`,
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
              Practice Sales Calls With AI
            </h1>
          </div>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Copy any of the prompts below into <span className="font-medium text-foreground">ChatGPT</span>, <span className="font-medium text-foreground">Claude</span>, or a similar AI tool. The AI will play the role of a prospect while you practice your side of the conversation.
            </p>
            <p>
              The goal is realistic practice, not memorization. There are no scripts to follow — just scenarios that force you to think on your feet.
            </p>
            <p>
              For best results, <span className="font-medium text-foreground">respond out loud</span> as if you're on a real call. Typing works, but speaking builds the muscle memory that matters.
            </p>
          </div>
        </motion.div>

        <div className="space-y-10">
          {prompts.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-1">
                <p.icon className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {p.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 pl-8">
                <span className="font-medium text-secondary-foreground">When to use:</span>{" "}
                {p.whenToUse}
              </p>

              <div className="relative rounded-lg bg-muted/40 p-5">
                <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider mb-3">
                  Copy This Prompt
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
      </div>
    </div>
  );
};

export default AIRoleplayPage;
