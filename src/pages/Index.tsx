import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import InterviewPrompt from "@/components/landing/InterviewPrompt";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CompetitiveSection from "@/components/landing/CompetitiveSection";
import ScenarioCards from "@/components/landing/ScenarioCards";
import CTASection from "@/components/landing/CTASection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import ActivityTicker from "@/components/landing/ActivityTicker";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ActivityTicker />
      <InterviewPrompt />
      <SocialProofBar />
      <HowItWorksSection />
      <CompetitiveSection />
      <ScenarioCards />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
