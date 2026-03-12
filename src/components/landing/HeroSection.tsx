import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
        <div className="mx-auto max-w-5xl">
          {/* Headline area */}
          <div className="text-center max-w-3xl mx-auto">
            {/* Live activity pulse */}
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
              Train your interview and sales skills
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex items-center justify-center gap-4 flex-wrap"
            >
              <Button variant="hero" size="lg" className="gap-2 px-8 py-6 text-lg" asChild>
                <Link to="/practice">
                  Start Practice
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="gap-2 px-8 py-6 border-border/60 hover:border-primary/40" asChild>
                <Link to="/leaderboard">
                  <Trophy className="h-4 w-4" />
                  View Leaderboard
                </Link>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-5 text-sm text-muted-foreground"
            >
              Free to try. No account required.
            </motion.p>
          </div>

          {/* Product Preview — Mock chat + result */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="card-elevated rounded-xl overflow-hidden">
              {/* Fake top bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/50" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono ml-2">Interview Prep — Hiring Manager</span>
              </div>

              {/* Chat messages */}
              <div className="p-5 space-y-4">
                {/* Interviewer */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-3"
                >
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">AI</span>
                  </div>
                  <div className="bg-muted/50 rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                    <p className="text-sm text-foreground">
                      Tell me about a time you handled a difficult prospect.
                    </p>
                  </div>
                </motion.div>

                {/* User */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className="flex gap-3 justify-end"
                >
                  <div className="bg-primary/10 rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                    <p className="text-sm text-foreground">
                      I worked with a customer who initially rejected our offer because of price. I anchored on the ROI and asked what their cost of inaction was…
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Result bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="border-t border-border bg-muted/20 px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Score</p>
                      <p className="text-2xl font-bold font-heading text-foreground">82</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Rank</p>
                      <p className="text-sm font-bold text-primary">Operator</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">ELO</p>
                      <p className="text-sm font-bold text-foreground">1340 <span className="text-primary text-xs">+18</span></p>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Top 12%
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
