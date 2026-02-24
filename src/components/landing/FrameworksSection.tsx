import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const frameworks = [
  {
    name: "The OPEN Framework",
    steps: ["Observe — Reference something specific", "Problem — Surface the pain", "Effect — Quantify the impact", "Next — Propose a clear next step"],
  },
  {
    name: "The 3-Part Objection Handler",
    steps: ["Acknowledge — Validate their concern", "Reframe — Shift perspective with data", "Advance — Ask a question that moves forward"],
  },
  {
    name: "The 30-Second Hook",
    steps: ["Who you are — One line, no fluff", "Why you're calling — Trigger event or pattern", "Permission — Ask to continue the conversation"],
  },
];

const FrameworksSection = () => {
  return (
    <section id="frameworks" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl font-bold md:text-5xl">
            Simple Frameworks That <span className="text-gradient">Stick</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Memorize the structure, own the conversation. Every framework fits on an index card.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {frameworks.map((fw, i) => (
            <motion.div
              key={fw.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated p-8 hover:border-primary/30 transition-all duration-300"
            >
              <h3 className="font-heading text-lg font-semibold text-foreground mb-5">{fw.name}</h3>
              <ul className="space-y-3">
                {fw.steps.map((step) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FrameworksSection;
