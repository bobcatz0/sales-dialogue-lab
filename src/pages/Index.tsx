import Navbar from "@/components/landing/Navbar";
import ChallengeHero from "@/components/landing/ChallengeHero";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import RankTiersSection from "@/components/landing/RankTiersSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ChallengeHero />
      <HowItWorksSection />
      <RankTiersSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default Index;
