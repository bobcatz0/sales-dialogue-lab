import { motion } from "framer-motion";
import { Target, MessageSquare, TrendingUp } from "lucide-react";

const steps = [
  {
    num: "1",
    icon: Target,
    title: "Practice a scenario",
  },
  {
    num: "2",
    icon: MessageSquare,
    title: "Get AI feedback",
  },
  {
    num: "3",
    icon: TrendingUp,
    title: "Climb the leaderboard",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            How it works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 relative z-10">
                <step.icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-mono text-primary/60 mb-1">{step.num}</p>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {step.title}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
