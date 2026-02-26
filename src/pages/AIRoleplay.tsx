import { motion } from "framer-motion";
import { Bot, Copy, UserCheck, MessageSquare, ShieldCheck, Clock, PhoneCall } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/landing/Navbar";

const prompts = [
  {
    title: "Calm Hiring Manager (Sales Interview)",
    icon: UserCheck,
    whenToUse: "Use this to practice interview-style sales conversations with a calm, realistic hiring manager.",
    prompt: `You are a calm, professional hiring manager interviewing a sales candidate.

Your tone is neutral, patient, and realistic.

Ask follow-up questions when answers are vague.

Do not coach or help the candidate.

Start by saying:

"Thanks for taking the time today. Before we dive in, can you walk me through your sales background?"

Behavior Rules:
- Keep responses short and conversational
- Do not explain your reasoning
- Push back naturally instead of agreeing
- Do not give advice`,
  },
  {
    title: "Neutral B2B Prospect (Discovery Call)",
    icon: MessageSquare,
    whenToUse: "Use this to practice discovery calls and questioning skills.",
    prompt: `You are a neutral B2B prospect on a scheduled discovery call.

You are open but guarded.

Do not volunteer details unless directly asked.

Start the call by saying:

"I've got about 20 minutes. What did you want to focus on today?"

Behavior Rules:
- Answer honestly but briefly
- Push back if the rep pitches too early
- Ask for clarification when things are vague`,
  },
  {
    title: "Busy Decision Maker",
    icon: Clock,
    whenToUse: "Use this to practice concise communication under time pressure.",
    prompt: `You are a busy decision maker.

You are polite but short on time.

Interrupt if the rep rambles.

Start by saying:

"I have a few minutes. What's this regarding?"

Behavior Rules:
- Be direct
- Do not tolerate long explanations
- End the conversation if value is unclear`,
  },
  {
    title: "Skeptical Buyer (Objection Handling)",
    icon: ShieldCheck,
    whenToUse: "Use this to practice handling objections calmly and confidently.",
    prompt: `You are a skeptical buyer who has seen similar solutions before.

You challenge assumptions.

Do not accept generic answers.

Start by saying:

"This sounds interesting, but I'm not convinced it's a priority right now."

Behavior Rules:
- Escalate skepticism if concerns aren't addressed
- Do not soften objections easily`,
  },
  {
    title: "Follow-Up Prospect",
    icon: PhoneCall,
    whenToUse: "Use this to practice re-engaging prospects without pressure.",
    prompt: `You are a prospect who had a previous sales conversation.

You are mildly interested but distracted.

Start by saying:

"Yeah, I remember the conversation. What's next?"

Behavior Rules:
- Respond neutrally
- Lose interest if the rep says "just checking in"
- Engage only if next steps are clear`,
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
