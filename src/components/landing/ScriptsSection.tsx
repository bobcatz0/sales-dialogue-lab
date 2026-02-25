import { motion } from "framer-motion";
import { Phone, Search, RotateCcw } from "lucide-react";

const scripts = [
  {
    title: "Cold Call – Getting a Stranger to Have a Real Conversation",
    icon: Phone,
    sections: [
      {
        label: "Opening – First 10 Seconds",
        line: "Hi [Name], this is [Your Name] from [Company] — I'll be quick. Is this a bad time?",
        note: "Ask permission immediately to disarm resistance.",
      },
      {
        label: "The Hook",
        line: "I work with [type of company] to help them [specific outcome]. I thought it was worth a quick conversation to see if it's relevant.",
        note: "Lead with outcome, not product features.",
      },
      {
        label: "Opening Question",
        line: "How are you currently handling [problem area]?",
        note: "Ask one short question and listen.",
      },
      {
        label: "Handling Pushback – 'We're already using something'",
        line: "Out of curiosity, is there anything about how it's working that you'd change if you could?",
      },
      {
        label: "Handling 'Not Interested'",
        line: "Is it timing, or just not relevant right now?",
      },
      {
        label: "Closing",
        line: "Would [day] or [day] work for a 20-minute call?",
      },
      {
        label: "If Not Ready",
        line: "Can I follow up by email and check back in [timeframe]?",
      },
    ],
    commonMistake: "Pitching before asking a question.",
  },
  {
    title: "Discovery Call – Diagnose Before You Present",
    icon: Search,
    sections: [
      {
        label: "Set the Agenda",
        line: "I'd like to understand your situation, share briefly what we do, and see if there's a fit. Does that work?",
      },
      {
        label: "Situation Question",
        line: "Can you walk me through how things currently work around [area]?",
      },
      {
        label: "Problem Question",
        line: "What part of that process causes the most friction?",
      },
      {
        label: "Impact Question",
        line: "What does that cost you in time, money, or headaches?",
      },
      {
        label: "Priority Question",
        line: "How much of a priority is solving this right now?",
      },
      {
        label: "Decision Process",
        line: "If you were to move forward, how would that decision get made?",
      },
      {
        label: "Brief Positioning",
        note: "Short 2–3 sentence explanation tied to their stated pain.",
      },
      {
        label: "Close",
        line: "What makes sense as a next step?",
      },
    ],
    commonMistake: "Demoing before diagnosing.",
  },
  {
    title: "Follow-Up Call – Keep Momentum Without Pressure",
    icon: RotateCcw,
    sections: [
      {
        label: "Reference Last Conversation",
        line: "We spoke [timeframe] ago about [topic]. Do you have a few minutes to pick up where we left off?",
      },
      {
        label: "Check for Changes",
        line: "Has anything changed since we last spoke?",
      },
      {
        label: "Re-Anchor",
        line: "You mentioned [specific pain]. Is that still the main priority?",
      },
      {
        label: "If They've Gone Cold",
        line: "Usually silence means timing changed, priority shifted, or something didn't land. What's the case here?",
      },
      {
        label: "Budget Objection",
        line: "Is that a hard stop or more of a timing issue?",
      },
      {
        label: "Going With Competitor",
        line: "Can I ask what made the difference?",
      },
      {
        label: "Close",
        line: "Can we set up the next step now while we're talking?",
      },
    ],
    commonMistake: "'Just checking in' without a real question.",
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
              <div className="flex items-center gap-3 mb-6">
                <script.icon className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-xl font-semibold text-foreground">
                  {script.title}
                </h3>
              </div>

              <div className="space-y-6 mb-8">
                {script.sections.map((section, si) => (
                  <div key={si}>
                    <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider mb-2">
                      {section.label}
                    </p>
                    {section.line && (
                      <p className="text-sm leading-relaxed text-foreground italic">
                        "{section.line}"
                      </p>
                    )}
                    {section.note && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-secondary-foreground">Common Mistake:</span>{" "}
                  {script.commonMistake}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScriptsSection;
