import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const questions = [
  { id: "unrealistic", label: "What felt unrealistic?" },
  { id: "helpful", label: "What felt helpful?" },
  { id: "confusing", label: "What confused you?" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const hasContent = Object.values(answers).some((v) => v.trim());
    if (!hasContent) {
      toast.error("Please fill in at least one field.");
      return;
    }
    // Store feedback locally for now (soft launch)
    try {
      const existing = JSON.parse(localStorage.getItem("salescalls_feedback") || "[]");
      existing.push({ ...answers, timestamp: new Date().toISOString() });
      localStorage.setItem("salescalls_feedback", JSON.stringify(existing));
    } catch { /* ignore */ }
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setAnswers({});
    }, 2000);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-lg hover:text-foreground hover:border-primary/40 transition-all duration-200"
        aria-label="Report issue or suggest improvement"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-14 right-4 z-50 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-foreground">
                Report Issue / Suggest Improvement
              </h3>
              <button
                onClick={() => { setOpen(false); setSubmitted(false); setAnswers({}); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {submitted ? (
              <div className="p-6 text-center">
                <p className="text-sm text-foreground font-medium">Thank you.</p>
                <p className="text-xs text-muted-foreground mt-1">Your feedback has been recorded.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      {q.label}
                    </label>
                    <Textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="text-xs min-h-[48px] resize-none"
                      rows={2}
                      placeholder="Optional"
                    />
                  </div>
                ))}
                <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit}>
                  <Send className="h-3 w-3 mr-1.5" />
                  Submit Feedback
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
