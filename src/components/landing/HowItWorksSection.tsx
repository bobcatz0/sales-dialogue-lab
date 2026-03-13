import { motion } from "framer-motion";
import { Target, MessageSquare, TrendingUp } from "lucide-react";

const steps = [
  { num: "01", icon: Target, title: "Pick a scenario", desc: "Cold call, discovery, objection handling" },
  { num: "02", icon: MessageSquare, title: "Get AI feedback", desc: "Instant scoring on your response" },
  { num: "03", icon: TrendingUp, title: "Climb the ranks", desc: "Earn ELO and track your progress" },
];

const HowItWorksSection = () => {
  return (
    <section className="py-12 md:py-16 border-t border-border/30">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-xl font-bold text-center mb-10 text-foreground md:text-2xl"
        >
          How it works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/40">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card/60 p-6 text-center flex flex-col items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <step.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-primary/50 mb-0.5">{step.num}</p>
                <h3 className="font-heading text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
