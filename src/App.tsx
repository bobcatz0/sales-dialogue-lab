import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Frameworks from "./pages/Frameworks";
import Roleplays from "./pages/Roleplays";
import AIRoleplay from "./pages/AIRoleplay";
import Practice from "./pages/Practice";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import DrillLibrary from "./pages/DrillLibrary";
import Scenarios from "./pages/Scenarios";
import Progress from "./pages/Progress";
import { FeedbackWidget } from "./components/FeedbackWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/drills" element={<DrillLibrary />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/progress" element={<Progress />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FeedbackWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
