import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ActivityTicker from "@/components/landing/ActivityTicker";
import HeroLeaderboardPreview from "@/components/landing/HeroLeaderboardPreview";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ActivityTicker />
      <HowItWorksSection />
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <HeroLeaderboardPreview />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Index;
