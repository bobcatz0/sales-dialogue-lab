import { motion } from "framer-motion";
import { Swords, BarChart3, Trophy, RotateCcw, TrendingUp } from "lucide-react";

const steps = [
  { num: "01", icon: Swords, title: "Take the challenge", desc: "Answer a real prospect objection in 60 seconds" },
  { num: "02", icon: BarChart3, title: "Get your score", desc: "AI evaluates clarity, structure, and impact" },
  { num: "03", icon: Trophy, title: "See your rank", desc: "Compare against other reps on the leaderboard" },
  { num: "04", icon: RotateCcw, title: "Replay & improve", desc: "Retry to beat your best score and climb higher" },
];

const HowItWorksSection = () => {
  return (
    <section className="py-12 md:py-16 border-t border-border/30">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
            Challenge → Score → Rank → Improve
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            Not another AI chat. A competitive skill platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/40">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card/60 p-5 text-center flex flex-col items-center gap-3"
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
