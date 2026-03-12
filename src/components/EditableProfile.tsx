import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";

export function EditableProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user || !profile) return null;

  async function handleSave() {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update name.");
    } else {
      toast.success("Display name updated!");
      await refreshProfile();
    }
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        avatarUrl={profile.avatar_url}
        displayName={profile.display_name}
        elo={profile.elo}
        size="md"
        showRankBadge={false}
      />

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className="flex items-center gap-1.5"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-36 text-sm"
              maxLength={30}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={saving || !name.trim()}>
              <Check className="h-3.5 w-3.5 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 min-w-0"
          >
            <span className="text-sm font-semibold text-foreground truncate">
              {profile.display_name}
            </span>
            <button
              onClick={() => { setName(profile.display_name); setEditing(true); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Edit display name"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
