import { motion, useInView } from "framer-motion";
import { Crown, Medal, User, TrendingUp } from "lucide-react";
import { useRef } from "react";
import { AnimatedCounter } from "./AnimatedStats";

const sampleLeaderboard = [
  { rank: 1, name: "Alex", tier: "Rainmaker", elo: 1620 },
  { rank: 2, name: "Sarah", tier: "Rainmaker", elo: 1584 },
  { rank: 3, name: "Jawan", tier: "Operator", elo: 1342 },
  { rank: 4, name: "Michelle", tier: "Closer", elo: 1180 },
  { rank: 5, name: "Ravi", tier: "Prospector", elo: 985 },
];

function getTierColor(tier: string) {
  switch (tier) {
    case "Sales Architect": return "text-purple-400";
    case "Rainmaker": return "text-yellow-400";
    case "Operator": return "text-blue-400";
    case "Closer": return "text-primary";
    case "Prospector": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

function getMedalIcon(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs text-muted-foreground font-bold">{rank}</span>;
}

const CompetitiveSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section className="py-20" ref={sectionRef}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Compete with other players
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Earn ELO, improve your skills, and climb the ranks.
          </p>
        </motion.div>

        <div className="max-w-xl mx-auto">
          {/* Leaderboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="card-elevated overflow-hidden"
          >
            <div className="grid grid-cols-[2.5rem_1fr_5rem_5rem] items-center px-5 py-3 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Tier</span>
              <span className="text-right">ELO</span>
            </div>
            <div className="divide-y divide-border">
              {sampleLeaderboard.map((entry, i) => (
                <motion.div
                  key={entry.name}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className={`grid grid-cols-[2.5rem_1fr_5rem_5rem] items-center px-5 py-3 ${
                    i === 0 ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {getMedalIcon(entry.rank)}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{entry.name}</span>
                  </div>
                  <span className={`text-[11px] font-semibold text-right ${getTierColor(entry.tier)}`}>
                    {entry.tier}
                  </span>
                  <span className={`text-sm font-bold font-heading text-right ${i === 0 ? "text-primary" : "text-foreground"}`}>
                    {entry.elo}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Competitive pillars */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 mt-6"
          >
            {[
              { label: "Earn ELO", desc: "Win points every session" },
              { label: "Climb ranks", desc: "Rookie → Sales Architect" },
              { label: "Compete weekly", desc: "Fresh leaderboard each week" },
            ].map((item) => (
              <div key={item.label} className="card-elevated p-4 text-center">
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveSection;
