import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { ActivityFeed } from "@/components/landing/ActivityFeed";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ScriptsSection from "@/components/landing/ScriptsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ActivityFeed />
      <FeaturesSection />
      <ScriptsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
