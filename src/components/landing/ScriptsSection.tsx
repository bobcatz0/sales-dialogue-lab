import { motion } from "framer-motion";
import { Phone, Search, RotateCcw } from "lucide-react";

const scripts = [
  {
    title: "Cold Call Script",
    icon: Phone,
    whenToUse: "Use this when reaching out to a prospect for the first time with no prior relationship or context.",
    lines: [
      { speaker: "You", text: "Hi [Name], this is [Your Name] from [Company]. Did I catch you at an okay time?" },
      { speaker: "Them", text: "(If yes or neutral)" },
      { speaker: "You", text: "I'll be quick. I noticed [trigger — e.g. your team just grew / you recently launched X]. A lot of [role/industry] teams we talk to are dealing with [specific problem]. Is that something you're running into?" },
      { speaker: "Them", text: "(Responds with context)" },
      { speaker: "You", text: "That makes sense. We help [type of company] with [one-line value prop]. Would it make sense to set up 15 minutes this week so I can show you how it works?" },
    ],
    notes: [
      "Keep it under 30 seconds before your first question.",
      "Reference something specific — generic openers get ignored.",
      "Always ask a question that invites them to talk, not just listen.",
    ],
  },
  {
    title: "Discovery Call Script",
    icon: Search,
    whenToUse: "Use this after a prospect has agreed to a meeting. The goal is to understand their situation, pain, and priorities before pitching anything.",
    lines: [
      { speaker: "You", text: "Thanks for taking the time, [Name]. Before I walk through anything, I'd love to understand what's going on with your team right now. What prompted you to take this call?" },
      { speaker: "Them", text: "(Shares context)" },
      { speaker: "You", text: "Got it. When that [problem] happens, what does that look like day-to-day for your team?" },
      { speaker: "Them", text: "(Describes impact)" },
      { speaker: "You", text: "And have you tried to solve that before? What worked, what didn't?" },
      { speaker: "Them", text: "(Shares history)" },
      { speaker: "You", text: "That's helpful. If you could fix one thing about [area], what would it be?" },
      { speaker: "Them", text: "(States priority)" },
      { speaker: "You", text: "Okay — based on what you've shared, here's how we'd approach it. [Brief, relevant walkthrough]. Does that align with what you're looking for?" },
    ],
    notes: [
      "Listen more than you talk — aim for a 70/30 split in their favor.",
      "Ask follow-up questions instead of moving to the next topic.",
      "Don't pitch until you understand their problem clearly.",
    ],
  },
  {
    title: "Follow-Up Call Script",
    icon: RotateCcw,
    whenToUse: "Use this when reconnecting with a prospect after a previous conversation, demo, or proposal — especially if they've gone quiet.",
    lines: [
      { speaker: "You", text: "Hi [Name], it's [Your Name] from [Company]. We spoke [timeframe] ago about [topic]. I wanted to check in — has anything changed on your end since then?" },
      { speaker: "Them", text: "(Responds with update or hesitation)" },
      { speaker: "You", text: "Totally understand. A lot of teams we work with had the same concern around [objection or delay reason]. What ended up happening with [their specific situation]?" },
      { speaker: "Them", text: "(Shares status)" },
      { speaker: "You", text: "That's helpful to know. Based on where you are now, would it make sense to [specific next step — e.g. revisit the proposal / loop in your team / schedule a short follow-up]?" },
    ],
    notes: [
      "Reference something specific from your last conversation to show you were paying attention.",
      "Don't assume the deal is dead — ask what changed.",
      "Offer a clear, low-commitment next step.",
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
            Sales Scripts
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three practical scripts for the most common sales conversations. Each one gives you a structure to follow — not a script to read word-for-word. Adapt the language to your style and industry.
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

              <div className="space-y-3 mb-8">
                {script.lines.map((line, j) => (
                  <div
                    key={j}
                    className={`flex gap-3 ${line.speaker === "Them" ? "pl-8" : ""}`}
                  >
                    <span
                      className={`shrink-0 text-xs font-semibold mt-1 w-12 ${
                        line.speaker === "You"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {line.speaker}
                    </span>
                    <p
                      className={`text-sm leading-relaxed ${
                        line.speaker === "You"
                          ? "text-foreground"
                          : "text-muted-foreground italic"
                      }`}
                    >
                      {line.text}
                    </p>
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
