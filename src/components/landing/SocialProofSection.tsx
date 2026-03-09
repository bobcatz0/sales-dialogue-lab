import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "I bombed my first SDR interview. After 10 sessions on SalesCalls.io, I nailed the next one and got the offer.",
    name: "Jordan M.",
    role: "SDR at Series B SaaS",
  },
  {
    quote: "The AI objection handling practice is insanely realistic. My cold call conversion went up 30% in two weeks.",
    name: "Priya K.",
    role: "BDR at Enterprise Tech",
  },
  {
    quote: "Better than any sales training I've done. The instant feedback loop is addictive — you actually want to do more reps.",
    name: "Marcus T.",
    role: "AE transitioning from SDR",
  },
];

const stats = [
  { value: "8+", label: "AI Buyer Personas" },
  { value: "0–100", label: "Session Scoring" },
  { value: "∞", label: "Unlimited Reps" },
  { value: "<30s", label: "To Start Practicing" },
];

const SocialProofSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-elevated glow-border p-8 mb-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-3">
            Real Results
          </p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Reps love the <span className="text-gradient">reps</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated p-7 flex flex-col"
            >
              <Quote className="h-5 w-5 text-primary/40 mb-4" />
              <p className="text-sm text-foreground leading-relaxed flex-1 italic">
                "{t.quote}"
              </p>
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
