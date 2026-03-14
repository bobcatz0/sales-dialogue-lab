import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LiveFeed from "@/components/landing/LiveFeed";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import RankTiersSection from "@/components/landing/RankTiersSection";
import HeroLeaderboardPreview from "@/components/landing/HeroLeaderboardPreview";
import WeeklyChallengeSection from "@/components/landing/WeeklyChallengeSection";
import DailyDrillSection from "@/components/landing/DailyDrillSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <LiveFeed />
      <DailyDrillSection />
      <HowItWorksSection />
      <WeeklyChallengeSection />
      <section className="py-10 md:py-14">
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
