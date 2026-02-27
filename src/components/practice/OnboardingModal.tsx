import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  open: boolean;
  onSelect: (status: "interviewing" | "preparing" | "exploring") => void;
}

const options = [
  { value: "interviewing" as const, label: "Yes — Interviewing Now" },
  { value: "preparing" as const, label: "Preparing Soon" },
  { value: "exploring" as const, label: "Just Exploring" },
];

export function OnboardingModal({ open, onSelect }: OnboardingModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="card-elevated w-full max-w-sm mx-4 p-6"
      >
        <h2 className="font-heading text-lg font-bold text-foreground text-center mb-1">
          Are you currently interviewing for an SDR role?
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-6">
          This helps us tailor your experience.
        </p>
        <div className="space-y-2.5">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant={opt.value === "interviewing" ? "default" : "outline"}
              className="w-full h-10 text-sm"
              onClick={() => onSelect(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
