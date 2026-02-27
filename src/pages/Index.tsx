import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ScriptsSection from "@/components/landing/ScriptsSection";
import CTASection from "@/components/landing/CTASection";
import { LeaderboardWidget } from "@/components/landing/LeaderboardWidget";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ScriptsSection />
      <LeaderboardWidget />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
