import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

const scriptLines = [
  { speaker: "Rep", text: "Hi [Name], this is Alex from SalesCalls. Did I catch you at an okay time?" },
  { speaker: "Prospect", text: "Uh, I'm kind of busy. What's this about?" },
  { speaker: "Rep", text: "Totally fair — I'll be quick. I noticed your team just expanded, and a lot of growing sales teams we work with struggle with inconsistent call quality. Is that something you're running into?" },
  { speaker: "Prospect", text: "Actually, yeah. Our newer reps have a tough time with objections." },
  { speaker: "Rep", text: "That's exactly what we help with. We give reps realistic practice scenarios and proven talk tracks so they can handle anything live. Would it make sense to show you how it works in 15 minutes this week?" },
];

const ScriptPreview = () => {
  return (
    <section id="scripts" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              See a Script <span className="text-gradient">In Action</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Our scripts are built from real conversations. Not theory — actual patterns that book meetings and close deals.
            </p>
            <div className="mt-6 flex gap-3">
              <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium">Cold Call</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground font-medium">Discovery</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground font-medium">Closing</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="card-elevated p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Cold Call — SaaS Outbound</span>
            </div>
            {scriptLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.3 }}
                className={`flex gap-3 ${line.speaker === "Prospect" ? "pl-8" : ""}`}
              >
                <span className={`shrink-0 text-xs font-semibold mt-1 w-16 ${
                  line.speaker === "Rep" ? "text-primary" : "text-muted-foreground"
                }`}>
                  {line.speaker}
                </span>
                <p className={`text-sm leading-relaxed ${
                  line.speaker === "Rep" ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {line.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScriptPreview;
