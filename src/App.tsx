
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const Index = lazy(() => import("@/pages/Index"));
const Explore = lazy(() => import("@/pages/Explore"));
const Timeline = lazy(() => import("@/pages/Timeline"));
const Videos = lazy(() => import("@/pages/Videos"));
const VideoShowcase = lazy(() => import("@/pages/VideoShowcase"));
const Messages = lazy(() => import("@/pages/Messages"));
const Players = lazy(() => import("@/pages/Players"));
const Profile = lazy(() => import("@/pages/Profile"));
const News = lazy(() => import("@/pages/News"));
const History = lazy(() => import("@/pages/History"));
const Contracts = lazy(() => import("@/pages/Contracts"));
const Notification = lazy(() => import("@/pages/Notification"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PlayerProfile = lazy(() => import("@/pages/PlayerProfile"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/video-showcase" element={<VideoShowcase />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/players" element={<Players />} />
              <Route path="/players/:playerId" element={<PlayerProfile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/news" element={<News />} />
              <Route path="/history" element={<History />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/notifications" element={<Notification />} />
              <Route path="/admin/user-management" element={<UserManagement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider >
);

export default App;
