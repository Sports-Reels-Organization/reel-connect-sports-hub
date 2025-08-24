
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
import Contracts from "./pages/Contracts";
import HistoryPage from "./pages/History";
import NewsPage from "./pages/News";
import Notification from "./pages/Notification";
import UserManagementPage from "./pages/UserManagement";

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
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/notifications" element={<Notification />} />
              <Route path="/user-management" element={<UserManagementPage />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
