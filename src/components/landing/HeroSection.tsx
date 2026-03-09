import { motion } from "framer-motion";
import { ArrowRight, Phone, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const SCENARIO_PILLS = [
  { label: "Cold Call", color: "text-blue-400 border-blue-400/20 bg-blue-400/5" },
  { label: "Discovery", color: "text-green-400 border-green-400/20 bg-green-400/5" },
  { label: "Objection Handling", color: "text-orange-400 border-orange-400/20 bg-orange-400/5" },
  { label: "Executive Pitch", color: "text-purple-400 border-purple-400/20 bg-purple-400/5" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container relative z-10 mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Phone className="h-3 w-3" />
            Duolingo for sales conversations
          </div>

          <h1 className="font-heading text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Practice Sales Calls{" "}
            <span className="text-gradient">With AI Buyers.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Choose a scenario. Have a real conversation. Get scored instantly.
            Improve with every rep.
          </p>

          {/* Scenario pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {SCENARIO_PILLS.map((pill) => (
              <span
                key={pill.label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${pill.color}`}
              >
                <MessageSquare className="h-3 w-3" />
                {pill.label}
              </span>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button variant="hero" size="lg" className="gap-2 text-base px-8 py-6" asChild>
              <a href="/scenarios">Browse Scenarios <ArrowRight className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6" asChild>
              <a href="/practice">Full Practice Mode</a>
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground font-heading">6</span>
              <span>Buyer Scenarios</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground font-heading">AI</span>
              <span>Real-time Feedback</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-foreground text-foreground" />
                <Star className="h-5 w-5 fill-foreground text-foreground" />
                <Star className="h-5 w-5 fill-foreground text-foreground" />
              </div>
              <span>Scored 0–100</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
