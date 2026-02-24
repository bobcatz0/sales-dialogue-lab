import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ScriptPreview from "@/components/landing/ScriptPreview";
import FrameworksSection from "@/components/landing/FrameworksSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ScriptPreview />
      <FrameworksSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
