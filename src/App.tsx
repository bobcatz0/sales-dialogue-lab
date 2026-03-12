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
import Clans from "./pages/Clans";
import JoinClan from "./pages/JoinClan";
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
            <Route path="/clans" element={<Clans />} />
            <Route path="/join/:code" element={<JoinClan />} />
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
