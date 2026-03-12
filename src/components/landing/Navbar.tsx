import { Phone, Menu, X, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEloRank } from "@/lib/elo";
import { NotificationBell } from "@/components/NotificationBell";
import { UserAvatar } from "@/components/UserAvatar";
import { EditableProfile } from "@/components/EditableProfile";

const navLinks = [
  { label: "Practice", href: "/practice" },
  { label: "Challenges", href: "/expert-challenges" },
  { label: "Clans", href: "/clans" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Progress", href: "/progress" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-bold text-foreground">
            SalesCalls<span className="text-primary">.io</span>
          </span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
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
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  displayName={profile?.display_name}
                  elo={profile?.elo ?? 1000}
                  size="xs"
                  showRankBadge={true}
                  showName={false}
                />
                <span className="font-bold text-foreground text-xs">{profile?.elo ?? 1000}</span>
              </a>
              <NotificationBell />
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
