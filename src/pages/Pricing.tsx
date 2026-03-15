import { Check, X, Zap, Users, Briefcase, Star, ArrowRight, Mic, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  tagline: string;
  price: string;
  period: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    tagline: "Get a taste of the arena",
    price: "$0",
    period: "forever",
    icon: <Zap className="h-5 w-5" />,
    cta: "Start Free",
    features: [
      { text: "Daily challenge", included: true },
      { text: "Leaderboard access", included: true },
      { text: "Basic text scenarios", included: true },
      { text: "Limited attempts per day", included: true },
      { text: "Voice mode", included: false },
      { text: "Advanced feedback", included: false },
      { text: "Replay review", included: false },
      { text: "Premium scenarios", included: false },
    ],
  },
  {
    name: "Pro",
    tagline: "Train like a top closer",
    price: "$15",
    period: "/month",
    icon: <Mic className="h-5 w-5" />,
    cta: "Go Pro",
    highlighted: true,
    badge: "Most Popular",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Unlimited attempts", included: true },
      { text: "Voice mode", included: true },
      { text: "Advanced AI feedback", included: true },
      { text: "Replay review & coaching", included: true },
      { text: "Premium scenarios", included: true },
      { text: "Priority leaderboard badge", included: true },
      { text: "Team features", included: false },
    ],
  },
  {
    name: "Teams",
    tagline: "Level up your entire squad",
    price: "$99",
    period: "/month",
    icon: <Users className="h-5 w-5" />,
    cta: "Start Team Trial",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Team leaderboard", included: true },
      { text: "Manager dashboard", included: true },
      { text: "Manager challenges", included: true },
      { text: "Team analytics", included: true },
      { text: "Invite links for reps", included: true },
      { text: "Up to 25 seats", included: true },
      { text: "Recruiter tools", included: false },
    ],
  },
  {
    name: "Recruiter",
    tagline: "Hire closers, not talkers",
    price: "Custom",
    period: "pay-per-assessment",
    icon: <Briefcase className="h-5 w-5" />,
    cta: "Contact Sales",
    features: [
      { text: "Pay-per-assessment packs", included: true },
      { text: "Candidate score reports", included: true },
      { text: "Recruiter dashboard", included: true },
      { text: "Sharable assessment links", included: true },
      { text: "Skill breakdown per candidate", included: true },
      { text: "Percentile benchmarking", included: true },
      { text: "ATS-ready exports", included: true },
      { text: "Custom scenario builder", included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20 px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary gap-1.5">
            <Star className="h-3 w-3" /> Simple Pricing
          </Badge>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Practice free.{" "}
            <span className="text-primary">Compete&nbsp;unlimited.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            The daily challenge is always free. Upgrade when you're ready for voice mode, advanced coaching, or team&nbsp;features.
          </p>
        </div>

        {/* Plans grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? "border-primary/60 bg-primary/[0.04] shadow-[0_0_40px_hsl(var(--primary)/0.12)]"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5 shadow-lg">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${plan.highlighted ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {plan.icon}
                  </div>
                  <h2 className="font-heading text-xl font-bold">{plan.name}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    ) : (
                      <X className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.highlighted ? "hero" : "outline"}
                className={`w-full gap-2 ${plan.highlighted ? "" : "hover:border-primary/40"}`}
                asChild
              >
                <a href={plan.name === "Recruiter" ? "/recruiter" : "/login"}>
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" /> No hidden fees
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" /> 7-day free trial on Pro
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
