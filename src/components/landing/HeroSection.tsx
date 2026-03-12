import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import HeroArenaFeed from "./HeroArenaFeed";
import HeroLeaderboardPreview from "./HeroLeaderboardPreview";

const HeroSection = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-16">
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
        <div className="mx-auto max-w-5xl space-y-12">
          {/* ── Headline ── */}
          <div className="text-center max-w-3xl mx-auto">
            {/* Live pulse */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-border bg-card/50"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs text-muted-foreground">Top players are practicing right now</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-heading text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
            >
              Train your interview skills
              <br />
              <span className="text-gradient">against AI.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mx-auto mt-6 max-w-lg text-lg md:text-xl text-muted-foreground"
            >
              Practice conversations, get scored, and climb the leaderboard.
            </motion.p>

            {/* ── CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-lg" asChild>
                <Link to="/practice">
                  Start Interview
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

          {/* ── Live Arena + Leaderboard Preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <HeroArenaFeed />
            <HeroLeaderboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
