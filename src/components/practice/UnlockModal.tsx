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
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center mb-2"
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          <DialogTitle className="text-xl font-heading">
            New Persona Unlocked
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-foreground mt-1">
            {personaName}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{personaDescription}</p>
        <Button onClick={onClose} className="mt-2 mx-auto">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
