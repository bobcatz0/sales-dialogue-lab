import { Phone } from "lucide-react";
import { APP_VERSION } from "@/version";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-bold text-foreground">
              SalesCalls<span className="text-primary"> Practice</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Structured Mock Interviews for SDR Candidates.
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Simulated interview environment. For practice purposes.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} SalesCalls Practice
            </p>
            <span className="text-[10px] text-muted-foreground/30">·</span>
            <span className="text-[10px] text-muted-foreground/40 font-mono">{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
