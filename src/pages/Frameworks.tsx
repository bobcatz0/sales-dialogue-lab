import { motion } from "framer-motion";
import { Lightbulb, Shield, Zap } from "lucide-react";

const frameworks = [
  {
    title: "Open – Probe – Pitch – Close",
    icon: Lightbulb,
    whenToUse: "Use this framework on structured sales calls when you need to guide the conversation without sounding robotic.",
    steps: [
      { label: "Open", description: "Set context and agenda for the call." },
      { label: "Probe", description: "Ask questions to uncover pain and priorities." },
      { label: "Pitch", description: "Briefly explain how you help, tied directly to what they shared." },
      { label: "Close", description: "Agree on a clear next step." },
    ],
    example: "\"Let me quickly outline how I'd like to use our time…\"\n\"What's the biggest challenge you're dealing with here?\"\n\"Based on that, here's how we usually help…\"\n\"Does it make sense to take the next step?\"",
  },
  {
    title: "Situation – Problem – Impact – Ask",
    icon: Shield,
    whenToUse: "Use this during discovery calls to move from surface-level problems to real urgency.",
    steps: [
      { label: "Situation", description: "Understand the current setup." },
      { label: "Problem", description: "Identify what isn't working." },
      { label: "Impact", description: "Explore the cost of the problem." },
      { label: "Ask", description: "Confirm priority and next step." },
    ],
    example: "\"How are you handling this today?\"\n\"What part of that is frustrating?\"\n\"What happens if this doesn't change?\"\n\"How important is it to solve this now?\"",
  },
  {
    title: "Anchor – Shift – Resolve – Step",
    icon: Zap,
    whenToUse: "Use this framework when handling objections or pushback.",
    steps: [
      { label: "Anchor", description: "Acknowledge their concern." },
      { label: "Shift", description: "Reframe the perspective." },
      { label: "Resolve", description: "Address the objection." },
      { label: "Step", description: "Move the conversation forward." },
    ],
    example: "\"I understand that concern.\"\n\"Most teams feel that way initially.\"\n\"What usually changes is…\"\n\"Would it make sense to explore this further?\"",
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
