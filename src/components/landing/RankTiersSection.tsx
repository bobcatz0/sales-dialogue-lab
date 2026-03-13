import { motion } from "framer-motion";
import { getEloRanks } from "@/lib/elo";

function getRankStyle(rank: string) {
  switch (rank) {
    case "Sales Architect": return { text: "text-purple-400", bg: "bg-purple-400/8", border: "border-purple-400/20", dot: "bg-purple-400" };
    case "Rainmaker": return { text: "text-yellow-400", bg: "bg-yellow-400/8", border: "border-yellow-400/20", dot: "bg-yellow-400" };
    case "Operator": return { text: "text-blue-400", bg: "bg-blue-400/8", border: "border-blue-400/20", dot: "bg-blue-400" };
    case "Closer": return { text: "text-primary", bg: "bg-primary/8", border: "border-primary/20", dot: "bg-primary" };
    case "Prospector": return { text: "text-orange-400", bg: "bg-orange-400/8", border: "border-orange-400/20", dot: "bg-orange-400" };
    default: return { text: "text-muted-foreground", bg: "bg-muted/20", border: "border-border", dot: "bg-muted-foreground" };
  }
}

function getRankDescription(rank: string) {
  switch (rank) {
    case "Sales Architect": return "Top 3%";
    case "Rainmaker": return "Top 10%";
    case "Operator": return "Top 25%";
    case "Closer": return "Top 50%";
    case "Prospector": return "Building skills";
    default: return "Getting started";
  }
}

export default function RankTiersSection() {
  const ranks = getEloRanks();

  return (
    <section className="py-12 md:py-16 border-t border-border/30">
      <div className="container mx-auto px-6 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
            Rank Tiers
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            Your ELO determines your rank. Climb by scoring well.
          </p>
        </motion.div>

        <div className="space-y-1.5">
          {[...ranks].reverse().map((rank, i) => {
            const s = getRankStyle(rank.name);
            return (
              <motion.div
                key={rank.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 rounded-lg border ${s.border} ${s.bg} px-4 py-2.5`}
              >
                <div className={`h-2 w-2 rounded-full ${s.dot} shrink-0`} />
                <span className={`text-xs font-bold ${s.text} w-[6.5rem] shrink-0`}>{rank.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{rank.min}+</span>
                <span className="text-[10px] text-muted-foreground/60 flex-1 text-right">
                  {getRankDescription(rank.name)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
