import { motion } from "framer-motion";
import { Phone, Search, RotateCcw } from "lucide-react";

const scripts = [
  {
    title: "Cold Call Script",
    icon: Phone,
    whenToUse: "First-time outreach to a prospect you've never spoken to. Your goal is to earn 30 more seconds, not close a deal.",
    sections: [
      {
        label: "Permission-Based Opener",
        lines: [
          { speaker: "You", text: "Hey [Name], this is [Your Name] with [Company]. I know I'm calling out of the blue — do you have a quick minute?" },
        ],
      },
      {
        label: "Brief Value Statement",
        lines: [
          { speaker: "You", text: "The reason I'm reaching out — we work with [type of team] that are struggling with [specific challenge]. I noticed [relevant trigger], and wanted to see if that's on your radar." },
        ],
      },
      {
        label: "Outcome-Focused Question",
        lines: [
          { speaker: "You", text: "When your team runs into [problem], how are you handling that right now?" },
        ],
      },
      {
        label: "Next-Step Ask",
        lines: [
          { speaker: "You", text: "It sounds like there might be a fit. Would it make sense to grab 15 minutes later this week so I can show you what we're doing differently?" },
        ],
      },
    ],
    notes: [
      "Get to a question within 20 seconds. If you're monologuing, you've already lost them.",
      "Use a real trigger — a job posting, a product launch, a funding round. Generic calls get generic rejections.",
      "You're not selling the product. You're selling the next conversation.",
    ],
  },
  {
    title: "Discovery Call Script",
    icon: Search,
    whenToUse: "The prospect agreed to a meeting. Now your job is to understand their world before you present anything.",
    sections: [
      {
        label: "Current Situation",
        lines: [
          { speaker: "You", text: "Before I jump into anything, I'd like to understand where things stand. Can you walk me through how your team handles [area] today?" },
        ],
      },
      {
        label: "Pain Clarification",
        lines: [
          { speaker: "You", text: "You mentioned [problem]. When that happens, what does it actually look like day-to-day?" },
        ],
      },
      {
        label: "Impact Questions",
        lines: [
          { speaker: "You", text: "How is that affecting [revenue / team performance / pipeline]? Have you been able to put a number on it?" },
        ],
      },
      {
        label: "Desired Outcome",
        lines: [
          { speaker: "You", text: "If you could change one thing about how this works right now, what would it be?" },
        ],
      },
      {
        label: "Timeline & Next Step",
        lines: [
          { speaker: "You", text: "That's really helpful. Is this something you're looking to solve this quarter, or more of a longer-term priority? Based on what you've shared, I think it'd make sense to [specific next step]. How does that sound?" },
        ],
      },
    ],
    notes: [
      "Aim for a 70/30 talk ratio in their favor. If you're talking more than they are, slow down and ask another question.",
      "Follow up on what they say — don't just move to the next question on your list.",
      "Don't pitch until you fully understand the problem. Premature solutions kill deals.",
    ],
  },
  {
    title: "Follow-Up Call Script",
    icon: RotateCcw,
    whenToUse: "You've already had a conversation, sent a proposal, or done a demo — and the prospect has gone quiet or hasn't committed to a next step.",
    sections: [
      {
        label: "Reference Previous Conversation",
        lines: [
          { speaker: "You", text: "Hey [Name], it's [Your Name]. Last time we spoke, you mentioned [specific detail from previous call]. I wanted to circle back on that." },
        ],
      },
      {
        label: "Reconfirm Priority",
        lines: [
          { speaker: "You", text: "Is [problem/goal] still a priority for your team, or have things shifted since we last talked?" },
        ],
      },
      {
        label: "Check for Changes",
        lines: [
          { speaker: "You", text: "Has anything changed internally — new stakeholders involved, budget conversations, anything like that?" },
        ],
      },
      {
        label: "Propose Next Step",
        lines: [
          { speaker: "You", text: "Based on where you are now, would it help to [specific, low-commitment action — e.g. loop in your manager for a quick 10-minute overview / revisit the proposal with updated numbers]?" },
        ],
      },
    ],
    notes: [
      "Reference something specific from your last conversation. It shows you were listening, not just following a sequence.",
      "Don't assume the deal is dead. Sometimes people just got busy.",
      "Always propose a concrete next step — vague follow-ups go nowhere.",
    ],
  },
];

const ScriptsSection = () => {
  return (
    <section id="scripts" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-16"
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
            Sales Call Scripts
          </h2>
          <p className="mt-4 text-muted-foreground">
            These scripts are designed as conversation structures, not word-for-word templates.
          </p>
          <p className="mt-2 text-muted-foreground">
            Read them aloud, adapt them to your own voice, and use them as a guide for real sales calls.
          </p>
          <p className="mt-2 text-muted-foreground">
            The goal of every call is a clear next step — not a hard close.
          </p>
        </motion.div>

        <div className="space-y-12">
          {scripts.map((script, i) => (
            <motion.div
              key={script.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <script.icon className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-xl font-semibold text-foreground">
                  {script.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                <span className="font-medium text-secondary-foreground">When to use:</span> {script.whenToUse}
              </p>

              <div className="space-y-6 mb-8">
                {script.sections.map((section, si) => (
                  <div key={si}>
                    <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider mb-2">
                      {section.label}
                    </p>
                    {section.lines.map((line, j) => (
                      <div key={j} className="flex gap-3">
                        <span className="shrink-0 text-xs font-semibold mt-1 w-12 text-primary">
                          {line.speaker}
                        </span>
                        <p className="text-sm leading-relaxed text-foreground">
                          {line.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-xs font-medium text-secondary-foreground mb-3 uppercase tracking-wider">
                  Coaching Notes
                </p>
                <ul className="space-y-2">
                  {script.notes.map((note, j) => (
                    <li
                      key={j}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-1">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScriptsSection;
