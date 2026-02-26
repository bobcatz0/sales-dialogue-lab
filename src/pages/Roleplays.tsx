import { motion } from "framer-motion";
import { Users, PhoneCall, ShieldCheck } from "lucide-react";

const roleplays = [
  {
    title: "Cold Call – First Contact",
    icon: PhoneCall,
    context:
      "A sales rep cold calls a mid-sized B2B company to see if there's potential relevance.",
    dialogue: [
      { speaker: "Rep", text: "Hi [Name], this is [Your Name]. I'll be quick — did I catch you at a bad time?" },
      { speaker: "Prospect", text: "I have a minute. What's this about?" },
      { speaker: "Rep", text: "I work with teams like yours to help improve [specific outcome]. I wanted to see if it's relevant to you." },
    ],
    coachingNotes: [
      "Ask permission early.",
      "Keep the opener short.",
      "Focus on outcomes, not features.",
    ],
  },
  {
    title: "Discovery Call – Understanding the Problem",
    icon: Users,
    context:
      "A scheduled discovery call to understand the prospect's current situation.",
    dialogue: [
      { speaker: "Rep", text: "Can you walk me through how you're currently handling this?" },
      { speaker: "Prospect", text: "We're doing X, but it's inconsistent." },
      { speaker: "Rep", text: "What part of that process causes the most friction?" },
    ],
    coachingNotes: [
      "Let the prospect do most of the talking.",
      "Ask follow-up questions.",
      "Avoid pitching too early.",
    ],
  },
  {
    title: "Objection Handling – Budget Concern",
    icon: ShieldCheck,
    context:
      "The prospect is interested but hesitant due to budget.",
    dialogue: [
      { speaker: "Prospect", text: "This sounds good, but budget is tight." },
      { speaker: "Rep", text: "That makes sense. Is it more about timing, or the total cost?" },
    ],
    coachingNotes: [
      "Acknowledge the concern.",
      "Clarify the real objection.",
      "Guide toward a next step.",
    ],
  },
];

const RoleplaysPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-16"
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
            Sales Call Roleplays
          </h1>
          <p className="mt-4 text-muted-foreground">
            Practice with realistic scenarios before you get on a real call.
            Each roleplay includes context, sample dialogue, and coaching notes.
          </p>
        </motion.div>

        <div className="space-y-12">
          {roleplays.map((rp, i) => (
            <motion.div
              key={rp.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <rp.icon className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {rp.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                <span className="font-medium text-secondary-foreground">Scenario:</span> {rp.context}
              </p>

              <div className="space-y-4 mb-8">
                <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                  Dialogue
                </p>
                {rp.dialogue.map((line, li) => (
                  <div
                    key={li}
                    className={`flex gap-3 ${line.speaker === "Prospect" ? "pl-8" : ""}`}
                  >
                    <span
                      className={`shrink-0 text-xs font-semibold mt-1 w-20 uppercase tracking-wider ${
                        line.speaker === "Rep" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {line.speaker}
                    </span>
                    <p
                      className={`text-sm leading-relaxed ${
                        line.speaker === "Rep" ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      "{line.text}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-xs font-medium text-secondary-foreground mb-3 uppercase tracking-wider">
                  Coaching Notes
                </p>
                <ul className="space-y-2">
                  {rp.coachingNotes.map((note, ni) => (
                    <li key={ni} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleplaysPage;
