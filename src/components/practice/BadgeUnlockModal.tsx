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
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="items-center">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-2"
              >
                <Award className="h-7 w-7 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          <DialogTitle className="text-lg font-heading">Badge Earned!</DialogTitle>
          <DialogDescription className="text-base font-medium text-foreground mt-1">
            {badge?.label}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{badge?.description}</p>
        <Button onClick={onClose} className="mt-2 mx-auto">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
