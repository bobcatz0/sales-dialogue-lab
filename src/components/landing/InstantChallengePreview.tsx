import { motion } from "framer-motion";
import { ArrowRight, MessageSquareQuote, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getTodayChallenge } from "@/components/practice/dailyChallenge";
import { ENVIRONMENTS } from "@/components/practice/environments";

const PROSPECT_LINES: Record<string, { quote: string; goal: string }> = {
  "cold-call": {
    quote: "We're happy with our current vendor.",
    goal: "Reopen the conversation without sounding pushy.",
  },
  enterprise: {
    quote: "We'd need to run this by our security team first.",
    goal: "Keep momentum without dismissing the concern.",
  },
  interview: {
    quote: "Tell me about a time you missed your quota.",
    goal: "Turn a tough question into a compelling story.",
  },
};

const FALLBACK = {
  quote: "We're happy with our current vendor.",
  goal: "Reopen the conversation without sounding pushy.",
};

export default function InstantChallengePreview() {
  const { challenge } = getTodayChallenge();
  const env = ENVIRONMENTS.find((e) => e.id === challenge.environmentId);
  const prompt = PROSPECT_LINES[challenge.environmentId] ?? FALLBACK;

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-6 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Label */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px flex-1 max-w-[50px] bg-gradient-to-r from-transparent to-primary/30" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Today's Challenge
            </span>
            <div className="h-px flex-1 max-w-[50px] bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-primary/5">
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            <div className="p-6 md:p-8 space-y-5">
              {/* Environment tag */}
              {env && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 border border-border px-2.5 py-1 rounded-full">
                  {env.title}
                </span>
              )}

              {/* Prospect quote */}
              <div className="rounded-xl bg-muted/30 border border-border p-5 relative">
                <MessageSquareQuote className="absolute top-4 right-4 h-5 w-5 text-primary/20" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Prospect says:
                </p>
                <p className="text-lg md:text-xl font-heading font-bold text-foreground leading-snug italic">
                  "{prompt.quote}"
                </p>
              </div>

              {/* Goal */}
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prompt.goal}
                </p>
              </div>

              {/* CTA */}
              <Button
                variant="hero"
                className="w-full h-12 text-sm gap-2"
                asChild
              >
                <Link to={`/practice?env=${challenge.environmentId}&role=${challenge.personaId}`}>
                  Write Your Response
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
