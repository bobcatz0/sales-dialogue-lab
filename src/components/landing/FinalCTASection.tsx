import { motion } from "framer-motion";
import { ArrowRight, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function FinalCTASection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-xl border border-primary/15 p-10 md:p-14 text-center max-w-xl mx-auto"
          style={{
            background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[120px] bg-primary/6 blur-[80px] rounded-full" />

          <div className="relative z-10 space-y-5">
            <Swords className="h-8 w-8 text-primary mx-auto" />
            <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
              Think you can score higher?
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Most reps score below 70. The leaderboard resets daily.
              <br />
              Prove you belong at the top.
            </p>
            <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-lg" asChild>
              <Link to="/practice">
                Take the Challenge
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <p className="text-[10px] text-muted-foreground/50">
              Free to play · AI-scored · Shareable results
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
