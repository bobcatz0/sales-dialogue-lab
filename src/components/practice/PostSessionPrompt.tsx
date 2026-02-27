import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface PostSessionPromptProps {
  type: "helpful" | "run-again";
  onResponse: (response: string) => void;
}

export function PostSessionPrompt({ type, onResponse }: PostSessionPromptProps) {
  const [answered, setAnswered] = useState(false);

  if (answered) return null;

  const question =
    type === "helpful"
      ? "Would this have helped you prepare for your real interview?"
      : "Would you run this again before your interview?";

  const options =
    type === "helpful"
      ? [
          { label: "Yes", value: "yes" },
          { label: "Somewhat", value: "somewhat" },
          { label: "No", value: "no" },
        ]
      : [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4"
    >
      <p className="text-xs text-foreground text-center mb-3 font-medium">
        {question}
      </p>
      <div className="flex items-center justify-center gap-2">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant="outline"
            size="sm"
            className="text-xs h-8 px-4"
            onClick={() => {
              setAnswered(true);
              onResponse(opt.value);
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
