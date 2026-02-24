import { Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-bold text-foreground">
              SalesCalls<span className="text-primary">.io</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#scripts" className="hover:text-foreground transition-colors">Scripts</a>
            <a href="#frameworks" className="hover:text-foreground transition-colors">Frameworks</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 SalesCalls.io. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
