import { useState } from "react";
import { motion } from "framer-motion";
import { Target, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { DRILLS, type DrillCategory } from "@/components/practice/drillData";
import { DrillMode } from "@/components/practice/DrillMode";
import { trackDrillCompletion } from "@/components/practice/drillTracking";

const CATEGORY_DESCRIPTIONS: Record<DrillCategory, string> = {
  Clarity: "Practice giving quantified, specific answers with real metrics.",
  Structure: "Master the Situation → Action → Result response format.",
  "Objection Handling": "Handle tough pushback and pressure questions directly.",
  Ownership: "Eliminate 'we' language and own your contributions.",
  Conciseness: "Deliver sharp, one-sentence answers with substance.",
};

export default function DrillLibrary() {
  const [activeDrill, setActiveDrill] = useState<DrillCategory | null>(null);
  const drill = activeDrill ? DRILLS[activeDrill] : null;

  return (
    <div className="min-h-screen bg-background font-[var(--font-body)]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link to="/practice">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-destructive" />
            <h1 className="text-lg font-semibold text-foreground font-[var(--font-heading)]">
              Skill Drills
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-8 ml-11">
          Select a category to practice targeted interview skills.
        </p>

        {drill && activeDrill ? (
          <DrillMode
            drill={drill}
            onComplete={() => {
              trackDrillCompletion(activeDrill);
              setActiveDrill(null);
            }}
            onDismiss={() => setActiveDrill(null)}
          />
        ) : (
          <div className="grid gap-3">
            {(Object.keys(DRILLS) as DrillCategory[]).map((category, i) => {
              const d = DRILLS[category];
              return (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveDrill(category)}
                  className="w-full text-left card-elevated p-4 hover:border-primary/30 border border-transparent transition-colors rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {d.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {CATEGORY_DESCRIPTIONS[category]}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap mt-0.5">
                      3 prompts
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    <span className="text-foreground/70 font-medium">Directive:</span>{" "}
                    {d.directive}
                  </p>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
