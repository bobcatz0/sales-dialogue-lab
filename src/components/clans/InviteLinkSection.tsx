import { useState } from "react";
import { Copy, Check, Link2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface InviteLinkSectionProps {
  inviteCode: string;
  referralPoints: number;
  canManage: boolean;
}

export function InviteLinkSection({ inviteCode, referralPoints, canManage }: InviteLinkSectionProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!canManage) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Gift className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-primary">{referralPoints}</span> referral points earned
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invite Link</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Gift className="h-3 w-3 text-primary" />
          <span className="font-semibold text-primary">{referralPoints}</span> pts
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          readOnly
          value={inviteUrl}
          className="text-xs h-8 font-mono bg-muted/50"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-3 gap-1.5 shrink-0"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Share this link to invite members. Each join earns <span className="text-primary font-semibold">+10 points</span> for the clan.
      </p>
    </div>
  );
}
