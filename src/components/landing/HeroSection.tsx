import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
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
            <Play className="h-3 w-3" />
            Built for SDR / AE Candidates
          </div>

          <h1 className="font-heading text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Structured Mock Interviews{" "}
            <span className="text-gradient">for Sales Roles.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Practice under pressure. Get evaluated. Improve clarity and control.
          </p>

          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground/70">
            Realistic AI-powered interview simulations with structured performance reports.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="gap-2" asChild>
              <a href="#scripts">View Scripts <ArrowRight className="h-4 w-4" /></a>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <a href="/frameworks">Explore Frameworks</a>
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground font-heading">3</span>
              <span>Roleplay Scenarios</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground font-heading">3</span>
              <span>Call Scripts</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground font-heading">3</span>
              <span>Frameworks</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
