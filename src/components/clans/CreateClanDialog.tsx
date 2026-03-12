import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CreateClanDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}

export function CreateClanDialog({ open, onOpenChange, onCreated }: CreateClanDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteOnly, setInviteOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!user || !name.trim()) return;
    setLoading(true);

    try {
      // Create clan
      const { data: clan, error: clanErr } = await supabase
        .from("clans")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          join_type: inviteOnly ? "invite_only" : "public",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (clanErr) throw clanErr;

      // Add creator as leader
      const { error: memberErr } = await supabase
        .from("clan_members")
        .insert({
          clan_id: clan.id,
          user_id: user.id,
          role: "leader",
        });

      if (memberErr) throw memberErr;

      toast.success("Clan created!");
      setName("");
      setDescription("");
      setInviteOnly(false);
      onOpenChange(false);
      onCreated(clan.id);
    } catch (e: any) {
      if (e?.code === "23505") {
        toast.error("A clan with that name already exists.");
      } else {
        toast.error(e?.message ?? "Failed to create clan.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Create Clan
          </DialogTitle>
          <DialogDescription>
            Start a clan for your team, company, or community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold">Clan Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Revenue Killers"
              className="mt-1"
              maxLength={32}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's your clan about?"
              className="mt-1 resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-semibold">Invite Only</Label>
              <p className="text-[10px] text-muted-foreground">
                Members must be invited by leaders or officers.
              </p>
            </div>
            <Switch checked={inviteOnly} onCheckedChange={setInviteOnly} />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="w-full"
          >
            {loading ? "Creating..." : "Create Clan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
