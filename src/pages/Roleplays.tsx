import { motion } from "framer-motion";
import { Users, PhoneCall, ShieldCheck, Clock, UserCheck } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

const roleplays = [
  {
    title: "Calm Hiring Manager (Sales Interview)",
    icon: UserCheck,
    description:
      "Practice interview-style conversations focused on clarity, confidence, and structured answers. Ideal for sales roles, account executives, and SDR interviews.",
  },
  {
    title: "Neutral B2B Prospect (Discovery Call)",
    icon: Users,
    description:
      "A balanced prospect who is open but guarded. Focus on discovery, qualification, and uncovering real pain without pitching too early.",
  },
  {
    title: "Busy Decision Maker",
    icon: Clock,
    description:
      "Short attention span, time pressure, and impatience. Practice getting to the point, earning permission, and respecting time constraints.",
  },
  {
    title: "Skeptical Buyer (Objection Handling)",
    icon: ShieldCheck,
    description:
      "Pushback on price, timing, and trust. Practice acknowledging concerns without getting defensive or sounding scripted.",
  },
  {
    title: "Follow-Up Prospect",
    icon: PhoneCall,
    description:
      'Someone who went quiet after a call. Practice re-engaging without pressure, guilt, or "just checking in" language.',
  },
];

const RoleplaysPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-16"
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
            Sales Call Roleplays
          </h1>
          <div className="mt-4 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Practice realistic sales conversations without memorizing scripts.
            </p>
            <p>
              These roleplays are designed to simulate real calls — the pauses,
              objections, uncertainty, and pressure that happen in actual
              conversations.
            </p>
            <p>
              Use them to practice thinking clearly, asking better questions, and
              staying calm under pressure.
            </p>
          </div>
        </motion.div>

        <h2 className="font-heading text-xl font-semibold text-foreground mb-8">
          Available Roleplay Scenarios
        </h2>

        <div className="space-y-8">
          {roleplays.map((rp, i) => (
            <motion.div
              key={rp.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <rp.icon className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {rp.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                {rp.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 max-w-xl space-y-2 text-sm text-muted-foreground/70 leading-relaxed">
          <p>
            These roleplays can be used solo, with a partner, or alongside an AI
            tool for simulated practice.
          </p>
          <p>No pricing, no signup, no hype language.</p>
        </div>
      </div>
    </div>
  );
};

export default RoleplaysPage;
