import { motion } from "framer-motion";
import { PhoneCall, FileText, LayoutGrid, Shield, Repeat, Brain } from "lucide-react";

const features = [
  {
    icon: PhoneCall,
    title: "Realistic AI Buyers",
    description: "8+ buyer personas with distinct personalities, objection styles, and industry context.",
  },
  {
    icon: Brain,
    title: "Instant AI Feedback",
    description: "Get scored 0–100 with specific coaching on tone, technique, and conversation flow.",
  },
  {
    icon: FileText,
    title: "Battle-Tested Scripts",
    description: "Cold call, discovery, and follow-up structures you can practice and adapt to your voice.",
  },
  {
    icon: LayoutGrid,
    title: "Sales Frameworks",
    description: "OPEN, 3-Part Objection Handler, 30-Second Hook — memorize the structure, own the call.",
  },
  {
    icon: Repeat,
    title: "Unlimited Reps",
    description: "Run as many sessions as you want. Each one is different. Repetition builds muscle memory.",
  },
  {
    icon: Shield,
    title: "Zero Risk Practice",
    description: "Make mistakes here, not on real calls. No pipeline damage, no burned leads.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-3">
            Features
          </p>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">
            Everything you need to <span className="text-gradient">prepare</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Purpose-built tools for SDR interview prep and sales call practice.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="card-elevated p-7 group hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
