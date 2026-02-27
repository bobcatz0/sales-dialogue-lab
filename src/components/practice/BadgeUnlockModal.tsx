import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import type { BadgeDef } from "@/components/practice/achievements";

interface BadgeUnlockModalProps {
  open: boolean;
  badge: BadgeDef | null;
  onClose: () => void;
}

export function BadgeUnlockModal({ open, badge, onClose }: BadgeUnlockModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs text-center">
        <DialogHeader className="items-center">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center mb-2"
              >
                <Award className="h-5.5 w-5.5 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          <DialogTitle className="text-base font-heading">Milestone Reached</DialogTitle>
          <DialogDescription className="text-sm font-medium text-foreground mt-0.5">
            {badge?.label}
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{badge?.description}</p>
        <Button size="sm" onClick={onClose} className="mt-1 mx-auto">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
