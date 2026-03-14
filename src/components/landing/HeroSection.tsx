import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-14">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Glow accents */}
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          {/* Social proof pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-sm"
          >
            <Zap className="h-3 w-3 text-primary" />
            <span>AI-scored sales practice</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-heading text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.5rem] text-foreground"
          >
            Test Your Sales Instincts.
            <br />
            <span className="text-gradient">Climb the Leaderboard.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mx-auto max-w-md text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            Compete in real sales scenarios, get scored instantly, and improve your rank.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center gap-3 pt-2"
          >
            <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-lg" asChild>
              <Link to="/practice">
                Start Scenario
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground/60">
              Free to try · No account required
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
