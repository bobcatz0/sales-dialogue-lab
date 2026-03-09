import { motion } from "framer-motion";
import { Phone, Building2, ShieldAlert, Users, Cpu, RotateCcw, ArrowRight, Zap, Briefcase, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  whatYouPractice: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: React.ElementType;
  color: string;
  env: string;
  role: string;
  duration: string;
  comingSoon?: boolean;
  framework?: { id: string; label: string };
}

const SCENARIOS: Scenario[] = [
  {
    id: "interview-pressure",
    title: "Interview Pressure Round",
    subtitle: "Prove yourself under scrutiny",
    description: "A hiring manager tests your experience, metrics, and thinking under pressure.",
    whatYouPractice: ["Structured responses", "Metric-driven storytelling", "Composure under pressure"],
    difficulty: "Beginner",
    icon: Briefcase,
    color: "text-amber-400",
    env: "interview",
    role: "hiring-manager",
    duration: "~4 min",
    framework: { id: "star", label: "STAR Method" },
  },
  {
    id: "discovery-call",
    title: "SaaS Discovery Call",
    subtitle: "Uncover pain, qualify the deal",
    description: "A guarded B2B prospect who won't volunteer information. You need to ask the right questions.",
    whatYouPractice: ["Open-ended questioning", "Active listening", "Qualifying budget and timeline"],
    difficulty: "Beginner",
    icon: Users,
    color: "text-green-400",
    env: "cold-call",
    role: "b2b-prospect",
    duration: "~5 min",
    framework: { id: "bant", label: "BANT Framework" },
  },
  {
    id: "objection-handling",
    title: "Objection Gauntlet",
    subtitle: "Turn no into yes",
    description: "A skeptical buyer hits you with price, timing, and competitor objections back to back.",
    whatYouPractice: ["Acknowledging without conceding", "Reframing value", "Staying calm under pressure"],
    difficulty: "Intermediate",
    icon: ShieldAlert,
    color: "text-orange-400",
    env: "enterprise",
    role: "skeptical-buyer",
    duration: "~5 min",
  },
  {
    id: "executive-pitch",
    title: "Executive Pitch",
    subtitle: "Win over the C-suite",
    description: "A time-constrained decision maker. Lead with outcomes, not features, or lose the room.",
    whatYouPractice: ["Business case framing", "Concise ROI delivery", "Handling executive-level pushback"],
    difficulty: "Intermediate",
    icon: Building2,
    color: "text-purple-400",
    env: "enterprise",
    role: "decision-maker",
    duration: "~5 min",
    framework: { id: "meddic", label: "MEDDIC Framework" },
  },
  {
    id: "technical-eval",
    title: "Technical Evaluation",
    subtitle: "Navigate the technical buyer",
    description: "A skeptical technical evaluator probing your product's depth, integrations, and security.",
    whatYouPractice: ["Technical credibility", "Specificity over buzzwords", "Handling deep product questions"],
    difficulty: "Advanced",
    icon: Cpu,
    color: "text-cyan-400",
    env: "enterprise",
    role: "technical-evaluator",
    duration: "~6 min",
  },
  {
    id: "champion-enablement",
    title: "Champion Enablement",
    subtitle: "Arm your internal advocate",
    description: "An internal champion who wants to help but needs the right ammunition to sell your deal internally.",
    whatYouPractice: ["Internal selling language", "Building a business case together", "Handling internal objections"],
    difficulty: "Advanced",
    icon: RotateCcw,
    color: "text-pink-400",
    env: "enterprise",
    role: "champion",
    duration: "~6 min",
  },
  {
    id: "cold-call-gatekeeper",
    title: "Cold Call",
    subtitle: "Get past the gatekeeper",
    description: "An assistant picks up. You have 30 seconds to earn a transfer to the decision maker.",
    whatYouPractice: ["Opening clarity", "Permission-based language", "Handling brush-offs"],
    difficulty: "Beginner",
    icon: Phone,
    color: "text-blue-400",
    env: "cold-call",
    role: "gatekeeper",
    duration: "~3 min",
    comingSoon: true,
  },
];
const DIFFICULTY_COLORS = {
  Beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  Intermediate: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

const Scenarios = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Zap className="h-3 w-3" />
            7 scenarios · New added regularly
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Choose Your{" "}
            <span className="text-gradient">Scenario</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Each scenario puts you in a real sales situation with a different buyer personality. Practice, get scored, repeat.
          </p>
        </motion.div>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {SCENARIOS.map((scenario, i) => {
            const Icon = scenario.icon;
            const isComingSoon = scenario.comingSoon;
            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`card-elevated p-5 flex flex-col gap-4 transition-all duration-200 group ${isComingSoon ? "opacity-50 pointer-events-none" : "hover:border-primary/30"}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 ${scenario.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isComingSoon && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-muted-foreground/20 bg-muted text-muted-foreground flex items-center gap-1">
                        <Mic className="h-2.5 w-2.5" />
                        Voice simulation
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[scenario.difficulty]}`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground leading-tight">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-primary mt-0.5 font-medium">{scenario.subtitle}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {scenario.description}
                </p>

                {/* What you practice */}
                <div className="space-y-1">
                  {scenario.whatYouPractice.map((skill) => (
                    <div key={skill} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                      {skill}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground/60">{scenario.duration}</span>
                  {isComingSoon ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs cursor-not-allowed opacity-70"
                      disabled
                    >
                      Coming Soon
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      size="sm"
                      className="h-8 text-xs gap-1.5 group-hover:gap-2 transition-all"
                      asChild
                    >
                      <a href={`/practice?env=${scenario.env}&role=${scenario.role}`}>
                        Start <ArrowRight className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            Want structured interview prep?{" "}
            <a href="/practice" className="text-primary hover:underline">
              Try the full practice environment →
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Scenarios;
