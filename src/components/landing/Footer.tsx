import { Phone } from "lucide-react";
import { APP_VERSION } from "@/version";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading text-sm font-bold text-foreground">
              SalesCalls<span className="text-primary">.io</span>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            © {new Date().getFullYear()} SalesCalls.io · AI-powered sales practice
          </p>
          <span className="text-[10px] text-muted-foreground/25 font-mono">{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
