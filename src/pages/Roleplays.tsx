import { motion } from "framer-motion";
import { Users, PhoneCall, ShieldCheck } from "lucide-react";

const roleplays = [
  {
    title: "Cold Call – SaaS Outbound to a VP of Sales",
    icon: PhoneCall,
    context:
      "You're calling a VP of Sales at a mid-market company. They weren't expecting the call. Your goal is to earn 30 more seconds of conversation and book a meeting.",
    dialogue: [
      { speaker: "Rep", text: "Hi Sarah, this is James from Acme. I know I'm calling out of the blue — do you have 30 seconds?" },
      { speaker: "Prospect", text: "I'm pretty busy. What's this about?" },
      { speaker: "Rep", text: "Fair enough. I work with sales teams that are scaling fast and struggling with inconsistent call quality across new reps. Is that something you're dealing with?" },
      { speaker: "Prospect", text: "Actually, yeah. We just hired six reps and onboarding has been rough." },
      { speaker: "Rep", text: "That's exactly what I'd want to talk about. Would 15 minutes later this week make sense to walk through how other teams are handling that?" },
      { speaker: "Prospect", text: "Sure, send me a calendar link." },
    ],
    coachingNotes: [
      "Ask permission early — it reduces resistance.",
      "Lead with a relevant problem, not a product pitch.",
      "Keep the ask small: 15 minutes, not a full demo.",
    ],
  },
  {
    title: "Discovery Call – Understanding the Real Problem",
    icon: Users,
    context:
      "You're on a scheduled discovery call with a Director of Revenue Operations. They agreed to the meeting but haven't shared much context. Your goal is to uncover the core problem and its business impact.",
    dialogue: [
      { speaker: "Rep", text: "Thanks for making time. I'd like to understand your situation, share a bit about what we do, and see if there's a fit. Sound good?" },
      { speaker: "Prospect", text: "Sure, go ahead." },
      { speaker: "Rep", text: "Can you walk me through how your team currently handles rep onboarding and call coaching?" },
      { speaker: "Prospect", text: "Honestly, it's mostly shadowing. New reps sit in on calls for a couple of weeks, then they're on their own." },
      { speaker: "Rep", text: "What part of that process creates the most friction?" },
      { speaker: "Prospect", text: "Reps feel unprepared. They freeze on objections and it takes months before they're productive." },
      { speaker: "Rep", text: "What does that cost you — in ramp time or lost pipeline?" },
      { speaker: "Prospect", text: "We're probably losing two to three months of productivity per rep." },
      { speaker: "Rep", text: "That's significant. How much of a priority is solving this right now?" },
      { speaker: "Prospect", text: "It's high on my list. We're hiring another cohort next quarter." },
    ],
    coachingNotes: [
      "Set a clear agenda before diving into questions.",
      "Move from situation → problem → impact — don't skip steps.",
      "Let the prospect quantify the cost themselves. It's more persuasive than you doing it.",
    ],
  },
  {
    title: "Objection Handling – 'We're Already Using Something'",
    icon: ShieldCheck,
    context:
      "Mid-conversation, the prospect tells you they already have a solution in place. Your goal is to understand satisfaction level and keep the door open without being pushy.",
    dialogue: [
      { speaker: "Prospect", text: "We actually already use a tool for this." },
      { speaker: "Rep", text: "Got it — that makes sense. Out of curiosity, is there anything about how it's working that you'd change if you could?" },
      { speaker: "Prospect", text: "Well, adoption has been low. Most reps don't use it consistently." },
      { speaker: "Rep", text: "That's a common issue. What do you think is driving the low adoption?" },
      { speaker: "Prospect", text: "It's clunky, and it doesn't feel relevant to real calls." },
      { speaker: "Rep", text: "That's useful context. Would it be worth a short conversation to see how other teams have solved that specific problem?" },
      { speaker: "Prospect", text: "Yeah, I'd be open to that." },
    ],
    coachingNotes: [
      "Don't argue or compare products. Ask about gaps instead.",
      "\"Out of curiosity\" softens the question and keeps the tone conversational.",
      "If they're happy with their current tool, respect that and move on.",
    ],
  },
];

const RoleplaysPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-16"
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl text-foreground">
            Sales Call Roleplays
          </h1>
          <p className="mt-4 text-muted-foreground">
            Practice with realistic scenarios before you get on a real call.
            Each roleplay includes context, sample dialogue, and coaching notes.
          </p>
        </motion.div>

        <div className="space-y-12">
          {roleplays.map((rp, i) => (
            <motion.div
              key={rp.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-elevated p-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <rp.icon className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {rp.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                <span className="font-medium text-secondary-foreground">Scenario:</span> {rp.context}
              </p>

              <div className="space-y-4 mb-8">
                <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                  Dialogue
                </p>
                {rp.dialogue.map((line, li) => (
                  <div
                    key={li}
                    className={`flex gap-3 ${line.speaker === "Prospect" ? "pl-8" : ""}`}
                  >
                    <span
                      className={`shrink-0 text-xs font-semibold mt-1 w-20 uppercase tracking-wider ${
                        line.speaker === "Rep" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {line.speaker}
                    </span>
                    <p
                      className={`text-sm leading-relaxed ${
                        line.speaker === "Rep" ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      "{line.text}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-xs font-medium text-secondary-foreground mb-3 uppercase tracking-wider">
                  Coaching Notes
                </p>
                <ul className="space-y-2">
                  {rp.coachingNotes.map((note, ni) => (
                    <li key={ni} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleplaysPage;
