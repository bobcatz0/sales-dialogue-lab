import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ActivityTicker from "@/components/landing/ActivityTicker";
import HeroLeaderboardPreview from "@/components/landing/HeroLeaderboardPreview";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import RankTiersSection from "@/components/landing/RankTiersSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ActivityTicker />
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <HeroLeaderboardPreview />
        </div>
      </section>
      <HowItWorksSection />
      <RankTiersSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default Index;
