import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Frameworks from "./pages/Frameworks";
import Roleplays from "./pages/Roleplays";
import AIRoleplay from "./pages/AIRoleplay";
import Practice from "./pages/Practice";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DrillLibrary from "./pages/DrillLibrary";
import Scenarios from "./pages/Scenarios";
import Progress from "./pages/Progress";
import Packs from "./pages/Packs";
import ExpertChallenges from "./pages/ExpertChallenges";
import BeatThePro from "./pages/BeatThePro";
import Clans from "./pages/Clans";
import JoinClan from "./pages/JoinClan";
import ScorecardPage from "./pages/ScorecardPage";
import Tournaments from "./pages/Tournaments";
import Challenges from "./pages/Challenges";
import Battles from "./pages/Battles";
import ManagerDashboard from "./pages/ManagerDashboard";
import JoinTeamChallenge from "./pages/JoinTeamChallenge";
import { FeedbackWidget } from "./components/FeedbackWidget";
import { WeeklyChampionCelebration } from "./components/clans/WeeklyChampionCelebration";
import { useRankThresholds } from "./hooks/useRankThresholds";

function RankThresholdsLoader() {
  useRankThresholds();
  return null;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RankThresholdsLoader />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/frameworks" element={<Frameworks />} />
            <Route path="/roleplays" element={<Roleplays />} />
            <Route path="/ai-roleplay" element={<AIRoleplay />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/drills" element={<DrillLibrary />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/packs" element={<Packs />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/expert-challenges" element={<ExpertChallenges />} />
            <Route path="/beat-the-pro" element={<BeatThePro />} />
            <Route path="/clans" element={<Clans />} />
            <Route path="/join/:code" element={<JoinClan />} />
            <Route path="/scorecard/:id" element={<ScorecardPage />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/battles" element={<Battles />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FeedbackWidget />
          <WeeklyChampionCelebration />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
