import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PhoneCall, Shield, Search, Handshake, ArrowRight, Zap } from "lucide-react";

const scenarios = [
  {
    title: "SDR Interview",
    desc: "Behavioral and situational questions",
    icon: PhoneCall,
    env: "interview",
    difficulty: "Beginner",
  },
  {
    title: "Cold Call Objection",
    desc: "Handle real-time pushback",
    icon: Shield,
    env: "cold-call",
    difficulty: "Intermediate",
  },
  {
    title: "Discovery Call",
    desc: "Uncover pain and qualify",
    icon: Search,
    env: "interview",
    difficulty: "Intermediate",
  },
  {
    title: "Enterprise Negotiation",
    desc: "Navigate complex deal dynamics",
    icon: Handshake,
    env: "enterprise",
    difficulty: "Advanced",
  },
];

function getDifficultyColor(d: string) {
  switch (d) {
    case "Beginner": return "text-primary border-primary/30 bg-primary/10";
    case "Intermediate": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    case "Advanced": return "text-orange-400 border-orange-400/30 bg-orange-400/10";
    default: return "text-muted-foreground border-border bg-muted";
  }
}

const ScenariosSection = () => {
  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Conversation challenges
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={`/practice?env=${s.env}`}
                className="card-elevated p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-200 group block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyColor(s.difficulty)}`}>
                    {s.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>+12-25 ELO</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScenariosSection;
