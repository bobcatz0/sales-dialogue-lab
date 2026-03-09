import { Phone } from "lucide-react";
import { APP_VERSION } from "@/version";

const Footer = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-primary" />
              <span className="font-heading text-base font-bold text-foreground">
                SalesCalls<span className="text-primary">.io</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              AI-powered sales rehearsal. Practice cold calls, discovery, and objection handling before the real thing.
            </p>
          </div>

          {/* Practice */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Practice</p>
            <ul className="space-y-2.5">
              <li><a href="/scenarios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Scenarios</a></li>
              <li><a href="/frameworks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Frameworks</a></li>
              <li><a href="/drills" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Drills</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Resources</p>
            <ul className="space-y-2.5">
              <li><a href="/practice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Full Simulator</a></li>
              <li><a href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Progress</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} SalesCalls.io · Simulated environment for practice purposes
          </p>
          <span className="text-[10px] text-muted-foreground/30 font-mono">{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
