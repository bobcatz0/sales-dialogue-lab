import { motion } from "framer-motion";
import { getEloRanks } from "@/lib/elo";

function getRankColor(rank: string) {
  switch (rank) {
    case "Sales Architect": return "text-purple-400 border-purple-400/30 bg-purple-400/10";
    case "Rainmaker": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
    case "Operator": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    case "Closer": return "text-primary border-primary/30 bg-primary/10";
    case "Prospector": return "text-orange-400 border-orange-400/30 bg-orange-400/10";
    default: return "text-muted-foreground border-border bg-muted/40";
  }
}

function getRankDescription(rank: string) {
  switch (rank) {
    case "Sales Architect": return "Top 3%. Exceptional across all scenarios.";
    case "Rainmaker": return "Top 10%. Consistently strong performance.";
    case "Operator": return "Top 25%. Solid fundamentals and composure.";
    case "Closer": return "Top 50%. Competent with room to grow.";
    case "Prospector": return "Building skills. Actively improving.";
    default: return "Just getting started. Keep practicing.";
  }
}

export default function RankTiersSection() {
  const ranks = getEloRanks();

  return (
    <section className="py-16">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Rank Tiers
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your ELO determines your rank. Climb by scoring well.
          </p>
        </motion.div>

        <div className="space-y-2">
          {[...ranks].reverse().map((rank, i) => (
            <motion.div
              key={rank.name}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${getRankColor(rank.name)}`}
            >
              <span className="text-sm font-bold w-20 shrink-0">{rank.name}</span>
              <span className="text-xs opacity-70 tabular-nums shrink-0">{rank.min}+ ELO</span>
              <span className="text-xs opacity-60 flex-1 text-right">
                {getRankDescription(rank.name)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
