import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px]" />

      <div className="container relative z-10 mx-auto px-6 py-16">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl text-foreground"
          >
            Train Your Sales Instincts.
            <br />
            <span className="text-gradient">Prove Your Skill.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto max-w-lg text-lg md:text-xl text-muted-foreground"
          >
            Answer real sales scenarios, get scored instantly, and climb the leaderboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-lg" asChild>
              <Link to="/practice">
                Start Scenario
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              Free to try. No account required.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
