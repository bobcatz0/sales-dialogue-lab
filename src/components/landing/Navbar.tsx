import { Phone, Menu, X, LogIn, User, LogOut, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Scenarios", href: "/scenarios" },
  { label: "Packs", href: "/packs" },
  { label: "Frameworks", href: "/frameworks" },
  { label: "Drills", href: "/drills" },
  { label: "Progress", href: "/progress" },
  { label: "Leaderboard", href: "/leaderboard" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-bold text-foreground">
            SalesCalls<span className="text-primary">.io</span>
          </span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <a href="/leaderboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <span className="font-medium text-foreground text-xs">{profile?.elo ?? 1000}</span>
              </a>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="hero" size="sm" asChild className="hidden sm:inline-flex">
              <a href="/login" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </a>
            </Button>
          )}
          <button
            className="md:hidden text-foreground p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="w-full mt-2 text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button variant="hero" size="sm" asChild className="w-full mt-2">
              <a href="/login">Sign In</a>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
