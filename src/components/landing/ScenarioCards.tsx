import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PhoneCall, Shield, Search, Handshake, ArrowRight, Zap, Swords, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEloRank, type RankTier } from "@/lib/elo";
import { useAuth } from "@/hooks/useAuth";

const RANK_ORDER: RankTier[] = ["Rookie", "Prospector", "Closer", "Operator", "Rainmaker", "Sales Architect"];

function isRankSufficient(userRank: RankTier, requiredRank: RankTier): boolean {
  return RANK_ORDER.indexOf(userRank) >= RANK_ORDER.indexOf(requiredRank);
}

const scenarios = [
  {
    title: "SDR Interview",
    desc: "Behavioral and situational questions",
    icon: PhoneCall,
    env: "interview",
    difficulty: "Beginner",
  },
  {
    title: "Cold Call Objection",
    desc: "Handle real-time pushback",
    icon: Shield,
    env: "cold-call",
    difficulty: "Intermediate",
    requiredRank: "Prospector" as RankTier,
  },
  {
    title: "Discovery Call",
    desc: "Uncover pain and qualify",
    icon: Search,
    env: "interview",
    difficulty: "Intermediate",
    requiredRank: "Closer" as RankTier,
  },
  {
    title: "Enterprise Negotiation",
    desc: "Navigate complex deal dynamics",
    icon: Handshake,
    env: "enterprise",
    difficulty: "Advanced",
    requiredRank: "Rainmaker" as RankTier,
  },
];

function getDifficultyColor(d: string) {
  switch (d) {
    case "Beginner": return "text-primary border-primary/30 bg-primary/10";
    case "Intermediate": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    case "Advanced": return "text-orange-400 border-orange-400/30 bg-orange-400/10";
    default: return "text-muted-foreground border-border bg-muted";
  }
}

const ScenariosSection = () => {
  const { profile } = useAuth();
  const userElo = profile?.elo ?? 1000;
  const userRank = getEloRank(userElo);

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Conversation challenges
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {scenarios.map((s, i) => {
            const isLocked = !!s.requiredRank && !isRankSufficient(userRank, s.requiredRank);
            return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              {isLocked ? (
                <div className="card-elevated p-5 flex flex-col gap-3 border-border/50 opacity-60 block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground shrink-0">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyColor(s.difficulty)}`}>
                      {s.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Requires {s.requiredRank}
                    </span>
                  </div>
                </div>
              ) : (
              <Link
                to={`/practice?env=${s.env}`}
                className="card-elevated p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-200 group block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyColor(s.difficulty)}`}>
                    {s.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>+12-25 ELO</span>
                  </div>
                </div>
              </Link>
              )}
            </motion.div>
            );
          })}
          {/* Expert Challenges CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="sm:col-span-2"
          >
            <Link
              to="/expert-challenges"
              className="card-elevated p-5 flex items-center gap-4 hover:border-yellow-400/30 transition-all duration-200 group block border-yellow-400/10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400 shrink-0 group-hover:bg-yellow-400/15 transition-colors">
                <Swords className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Beat the Expert</p>
                <p className="text-[11px] text-muted-foreground">
                  Verified experts set the bar. Can you score higher?
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-yellow-400 transition-colors shrink-0" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScenariosSection;
