import { motion } from "framer-motion";
import { PhoneCall, FileText, LayoutGrid, Target } from "lucide-react";

const features = [
  {
    icon: PhoneCall,
    title: "Interview Simulations",
    description:
      "Realistic AI-powered mock interviews with hiring manager personas. Resume-personalized questions that probe your metrics, process, and ownership.",
  },
  {
    icon: FileText,
    title: "Scripts & Structure",
    description:
      "Practical call structures with built-in objection responses. Frameworks to guide your conversations — not word-for-word templates.",
  },
  {
    icon: LayoutGrid,
    title: "Frameworks",
    description:
      "Simple, repeatable frameworks that give structure to any sales conversation, including how to handle common pushback.",
  },
];

const preInterviewSteps = [
  {
    step: 1,
    title: "Run Resume-Based Interview Simulation",
    description: "Paste your key resume highlights. The AI interviewer will probe your specific claims, metrics, and experience.",
  },
  {
    step: 2,
    title: "Review Performance Report",
    description: "Get a structured evaluation: skill breakdown, resume alignment, strengths, and development areas.",
  },
  {
    step: 3,
    title: "Re-run Until Interview Readiness Score is 75+",
    description: "Scoring 75+ signals you're prepared for the real conversation. Repeat until you're confident.",
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
            Everything You Need to <span className="text-gradient">Prepare</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Structured rehearsal tools designed to sharpen your interview performance before the real thing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Recommended Pre-Interview Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-20"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-3">
              <Target className="h-4 w-4" />
              Recommended Pre-Interview Plan
            </div>
            <h3 className="font-heading text-2xl font-bold md:text-3xl text-foreground">
              Three Steps Before Your Interview
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {preInterviewSteps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="card-elevated p-6 relative"
              >
                <span className="text-4xl font-bold font-heading text-primary/15 absolute top-4 right-5">
                  {item.step}
                </span>
                <h4 className="font-heading text-sm font-semibold text-foreground mb-2 pr-8">
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
