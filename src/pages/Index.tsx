import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LiveFeed from "@/components/landing/LiveFeed";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import RankTiersSection from "@/components/landing/RankTiersSection";
import HeroLeaderboardPreview from "@/components/landing/HeroLeaderboardPreview";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <LiveFeed />
      <HowItWorksSection />
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <HeroLeaderboardPreview />
        </div>
      </section>
      <RankTiersSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default Index;
