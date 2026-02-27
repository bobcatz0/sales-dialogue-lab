import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface UnlockModalProps {
  open: boolean;
  personaName: string;
  personaDescription: string;
  onClose: () => void;
}

export function UnlockModal({ open, personaName, personaDescription, onClose }: UnlockModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="items-center">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-2"
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          <DialogTitle className="text-lg font-heading">
            Scenario Unlocked
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-foreground mt-1">
            {personaName}
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{personaDescription}</p>
        <Button size="sm" onClick={onClose} className="mt-1 mx-auto">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
