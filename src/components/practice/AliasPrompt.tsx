import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAlias, saveAlias } from "@/components/practice/achievements";

interface AliasPromptProps {
  open: boolean;
  onComplete: (alias: string) => void;
}

export function AliasPrompt({ open, onComplete }: AliasPromptProps) {
  const [value, setValue] = useState("");
  const autoAlias = generateAlias();

  const handleSubmit = () => {
    const alias = value.trim() || autoAlias;
    saveAlias(alias);
    onComplete(alias);
  };

  const handleSkip = () => {
    saveAlias(autoAlias);
    onComplete(autoAlias);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Choose Your Alias</DialogTitle>
          <DialogDescription>
            Pick a display name for the leaderboard, or we'll assign one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Input
            placeholder={autoAlias}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={20}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              Save
            </Button>
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
