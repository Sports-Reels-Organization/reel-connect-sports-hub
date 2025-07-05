
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Pages
import Index from "./pages/Index";
import Players from "./pages/Players";
import Videos from "./pages/Videos";
import VideoShowcase from "./pages/VideoShowcase";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Timeline from "./pages/Timeline";
import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";
import Contracts from "./pages/Contracts";
import Shortlist from "./pages/Shortlist";

// New pages
import History from "./components/History";
import News from "./components/News";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/players" element={<Players />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/video-showcase" element={<VideoShowcase />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/shortlist" element={<Shortlist />} />
              <Route path="/history" element={<History />} />
              <Route path="/news" element={<News />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
