import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 p-12 md:p-16 text-center max-w-3xl mx-auto"
          style={{
            background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--background)) 50%, hsl(var(--card)) 100%)",
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[180px] bg-primary/8 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Test your conversation skills.
            </h2>
            <div className="mt-8">
              <Button variant="hero" size="lg" className="gap-2 px-10 py-6 text-lg" asChild>
                <Link to="/practice">
                  Start Practice
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
