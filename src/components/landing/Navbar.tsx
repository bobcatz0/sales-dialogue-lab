import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-bold text-foreground">
            SalesCalls<span className="text-primary">.io</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
          <a href="#scripts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Scripts</a>
          <a href="/frameworks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Frameworks</a>
          <a href="/roleplays" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roleplays</a>
          <a href="/ai-roleplay" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Scenarios</a>
          <a href="/practice" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Mock Interview</a>
          <a href="/leaderboard" className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">Leaderboard</a>
        </div>
        <Button variant="hero" size="sm" asChild>
          <a href="#scripts">View Scripts</a>
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
