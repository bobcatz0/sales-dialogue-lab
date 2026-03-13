import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function FinalCTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6 max-w-xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Ready to find out where you rank?
          </h2>
          <p className="text-muted-foreground text-sm">
            Pick a scenario. Answer honestly. Get your score.
          </p>
          <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-lg" asChild>
            <Link to="/practice">
              Start Scenario
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
