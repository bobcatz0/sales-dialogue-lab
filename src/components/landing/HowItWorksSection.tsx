import { motion } from "framer-motion";
import { MousePointer2, MessageSquare, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MousePointer2,
    title: "Pick a scenario",
    description: "Cold call, discovery, objection handling, executive pitch — choose what you want to sharpen.",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Have the conversation",
    description: "The AI buyer responds like a real prospect — with objections, questions, and realistic pushback.",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Get your score",
    description: "Receive a detailed breakdown of what worked, what didn't, and exactly how to improve.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-3">
            How It Works
          </p>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">
            Three steps to <span className="text-gradient">confidence</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center relative"
            >
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 relative z-10">
                <step.icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-mono text-primary/60 mb-2">{step.num}</p>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
