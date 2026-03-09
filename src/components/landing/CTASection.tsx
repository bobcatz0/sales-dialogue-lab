import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 p-12 md:p-20 text-center max-w-4xl mx-auto"
          style={{
            background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--background)) 50%, hsl(var(--card)) 100%)",
          }}
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/8 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <h2 className="font-heading text-3xl font-bold md:text-5xl leading-tight">
              Your next interview is coming.
              <br />
              <span className="text-gradient">Are you ready?</span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-md mx-auto text-lg">
              Run a mock SDR interview right now. Get scored. Know exactly where you stand.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-lg" asChild>
                <a href="/scenarios">
                  Start Rehearsal Now
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Free · No account needed · Takes 5 minutes
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
