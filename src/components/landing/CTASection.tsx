import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section id="resources" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-elevated glow-border p-12 md:p-16 text-center max-w-3xl mx-auto"
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Ready to <span className="text-gradient">Rehearse</span>?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Run a full interview simulation. Review your performance report. Repeat until you're confident.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="gap-2" asChild>
              <a href="/practice">Start Mock SDR Interview <ArrowRight className="h-4 w-4" /></a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
