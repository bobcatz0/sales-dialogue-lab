import { motion } from "framer-motion";
import { Lightbulb, Shield, Zap } from "lucide-react";

const frameworks = [
  {
    title: "The OPEN Framework",
    icon: Lightbulb,
    whenToUse: "Use this on cold calls and early outreach when you need to earn the right to keep talking.",
    steps: [
      { label: "Observe", description: "Reference something specific about the prospect — a job posting, a product launch, a recent funding round." },
      { label: "Problem", description: "Name a challenge that's common for people in their role or industry." },
      { label: "Effect", description: "Describe the cost of leaving it unsolved — lost revenue, wasted time, missed targets." },
      { label: "Next", description: "Propose a low-commitment next step — a short call, a resource, a quick demo." },
    ],
    example: "\"I saw your team just opened three new AE roles — congrats. A lot of sales teams scaling that fast struggle with inconsistent call quality across new hires. That usually means longer ramp time and missed quota in Q1. Would it make sense to grab 15 minutes to see how we help with that?\"",
  },
  {
    title: "The 3-Part Objection Handler",
    icon: Shield,
    whenToUse: "Use this when a prospect pushes back — on price, timing, competition, or relevance. Works in any stage of the sales process.",
    steps: [
      { label: "Acknowledge", description: "Validate their concern without arguing. Show you heard them." },
      { label: "Reframe", description: "Shift their perspective with a question, a data point, or a different angle." },
      { label: "Advance", description: "Ask a forward-moving question that keeps the conversation going." },
    ],
    example: "Prospect: \"We're happy with what we have.\"\n\nYou: \"That makes sense — most teams we talk to weren't actively looking either. Out of curiosity, if there was one thing about your current setup you could improve, what would it be?\"\n\nThis keeps the door open without being pushy.",
  },
  {
    title: "The 30-Second Hook",
    icon: Zap,
    whenToUse: "Use this at the very start of a cold call. You have about 30 seconds before the prospect decides to keep listening or hang up.",
    steps: [
      { label: "Who you are", description: "One line. Your name and company. No long intro." },
      { label: "Why you're calling", description: "A trigger event or pattern you noticed — something specific to them." },
      { label: "Permission", description: "Ask if you can take 30 more seconds. This gives them control and reduces resistance." },
    ],
    example: "\"Hi Sarah, this is James from Acme. I noticed your team just launched a new product line — we've been helping similar companies make sure their outbound keeps up with that kind of growth. Do you have 30 seconds for me to explain why I called?\"",
  },
];

const FrameworksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-16"
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
            Sales Frameworks
          </h1>
          <p className="mt-4 text-muted-foreground">
            Frameworks give you a repeatable structure for common sales moments.
          </p>
          <p className="mt-2 text-muted-foreground">
            Learn the pattern, practice it out loud, and adapt it to your own style.
          </p>
          <p className="mt-2 text-muted-foreground">
            Each one is simple enough to memorize and flexible enough to use in real conversations.
          </p>
        </motion.div>

        <div className="space-y-12">
          {frameworks.map((fw, i) => (
            <motion.div
              key={fw.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <fw.icon className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {fw.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                <span className="font-medium text-secondary-foreground">When to use:</span> {fw.whenToUse}
              </p>

              <div className="space-y-4 mb-8">
                {fw.steps.map((step, si) => (
                  <div key={si} className="flex gap-3">
                    <span className="shrink-0 text-xs font-semibold mt-1 w-24 text-primary uppercase tracking-wider">
                      {step.label}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-xs font-medium text-secondary-foreground mb-3 uppercase tracking-wider">
                  Example
                </p>
                <p className="text-sm text-muted-foreground italic whitespace-pre-line">
                  {fw.example}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrameworksPage;
