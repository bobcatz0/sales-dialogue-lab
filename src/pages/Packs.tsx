import { motion } from "framer-motion";
import { Phone, Users, Briefcase, ArrowRight, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";

interface PackScenario {
  title: string;
  framework?: string;
  env: string;
  role: string;
}

interface Pack {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  scenarios: PackScenario[];
}

const PACKS: Pack[] = [
  {
    id: "sdr-cold-call",
    title: "SDR Cold Call Pack",
    description: "Master the cold call from opener to booked meeting. Practice gatekeepers, objections, and closing for next steps.",
    icon: Phone,
    color: "text-blue-400",
    scenarios: [
      { title: "Gatekeeper Opener", framework: "SDR Opener Structure", env: "cold-call", role: "gatekeeper" },
      { title: "Objection Gauntlet", env: "enterprise", role: "skeptical-buyer" },
      { title: "Discovery Call", framework: "BANT Framework", env: "cold-call", role: "b2b-prospect" },
    ],
  },
  {
    id: "saas-discovery",
    title: "SaaS Discovery Pack",
    description: "Run structured discovery calls using professional frameworks. Qualify budget, authority, need, and timeline.",
    icon: Users,
    color: "text-green-400",
    scenarios: [
      { title: "BANT Discovery Call", framework: "BANT Framework", env: "cold-call", role: "b2b-prospect" },
      { title: "Executive Pitch", framework: "MEDDIC Framework", env: "enterprise", role: "decision-maker" },
      { title: "Objection Gauntlet", env: "enterprise", role: "skeptical-buyer" },
    ],
  },
  {
    id: "sales-interview",
    title: "Sales Interview Pack",
    description: "Prepare for SDR and AE interviews. Practice behavioral questions, roleplay rounds, and objection drills.",
    icon: Briefcase,
    color: "text-amber-400",
    scenarios: [
      { title: "STAR Interview Round", framework: "STAR Method", env: "interview", role: "hiring-manager" },
      { title: "Discovery Roleplay", framework: "BANT Framework", env: "cold-call", role: "b2b-prospect" },
      { title: "Objection Handling", env: "enterprise", role: "skeptical-buyer" },
    ],
  },
];

const Packs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Package className="h-3 w-3" />
            Structured training paths
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Practice <span className="text-gradient">Packs</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Curated scenario bundles that build skills in sequence. Complete all three to cover the full evaluation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PACKS.map((pack, i) => {
            const Icon = pack.icon;
            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card-elevated p-6 flex flex-col gap-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0 ${pack.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">{pack.title}</h2>
                    <p className="text-xs text-muted-foreground">{pack.scenarios.length} scenarios</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {pack.description}
                </p>

                <div className="space-y-2.5">
                  {pack.scenarios.map((scenario, j) => (
                    <div
                      key={j}
                      className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 p-3"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{scenario.title}</p>
                        {scenario.framework && (
                          <p className="text-[11px] text-primary mt-0.5">Framework: {scenario.framework}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="hero"
                  className="w-full gap-2 mt-auto"
                  asChild
                >
                  <a href={`/practice?env=${pack.scenarios[0].env}&role=${pack.scenarios[0].role}`}>
                    Start Pack <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center mt-14 space-y-2"
        >
          <p className="text-sm text-muted-foreground">
            Want to pick individual scenarios?{" "}
            <a href="/scenarios" className="text-primary hover:underline">
              Browse all scenarios →
            </a>
          </p>
          <p className="text-xs text-muted-foreground/60">
            Coming soon: upload your own scoring rubric for custom team training.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Packs;
