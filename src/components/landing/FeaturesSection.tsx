import { motion } from "framer-motion";
import { PhoneCall, FileText, Shield, LayoutGrid } from "lucide-react";

const features = [
  {
    icon: PhoneCall,
    title: "Realistic Roleplays",
    description: "Practice cold calls, discovery calls, and closing conversations with realistic scenario context and dialogue.",
  },
  {
    icon: FileText,
    title: "Proven Scripts",
    description: "Battle-tested cold call and discovery call scripts you can use immediately to structure better conversations.",
  },
  {
    icon: Shield,
    title: "Objection Handling",
    description: "Specific talk tracks for every common objection — pricing, timing, competition, and authority.",
  },
  {
    icon: LayoutGrid,
    title: "Sales Frameworks",
    description: "Simple, repeatable frameworks that give structure to any sales conversation without sounding robotic.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl font-bold md:text-5xl">
            Everything You Need to{" "}
            <span className="text-gradient">Sell Better</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Practical tools and resources designed for reps who want to improve on real calls — not theory.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card-elevated p-8 group hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
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
