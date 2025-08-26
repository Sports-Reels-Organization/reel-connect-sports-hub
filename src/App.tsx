
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import LoadingPreloader from "@/components/LoadingPreloader";

// Pages
import Index from "@/pages/Index";
import Explore from "@/pages/Explore";
import TeamExplore from "@/pages/TeamExplore";
import Players from "@/pages/Players";
import PlayerProfile from "@/pages/PlayerProfile";
import TransferPitchDetails from "@/pages/TransferPitchDetails";
import Videos from "@/pages/Videos";
import VideoAnalysis from "@/pages/VideoAnalysis";
import VideoShowcase from "@/pages/VideoShowcase";
import Messages from "@/pages/Messages";
import History from "@/pages/History";
import Timeline from "@/pages/Timeline";
import Profile from "@/pages/Profile";
import News from "@/pages/News";
import Contracts from "@/pages/Contracts";
import AgentShortlist from "@/pages/AgentShortlist";
import UserManagement from "@/pages/UserManagement";
import Notification from "@/pages/Notification";
import NotFound from "@/pages/NotFound";

// Components
import NotificationCenter from "@/components/NotificationCenter";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingPreloader />;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public route */}
                <Route path="/" element={<Index />} />
                
                {/* Protected routes */}
                <Route path="/explore" element={
                  <ProtectedRoute>
                    <Explore />
                  </ProtectedRoute>
                } />
                
                <Route path="/team-explore" element={
                  <ProtectedRoute>
                    <TeamExplore />
                  </ProtectedRoute>
                } />
                
                <Route path="/players" element={
                  <ProtectedRoute>
                    <Layout>
                      <Players />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/player-profile/:playerId" element={
                  <ProtectedRoute>
                    <PlayerProfile />
                  </ProtectedRoute>
                } />
                
                <Route path="/transfer-pitch/:pitchId" element={
                  <ProtectedRoute>
                    <TransferPitchDetails />
                  </ProtectedRoute>
                } />
                
                <Route path="/videos" element={
                  <ProtectedRoute>
                    <Layout>
                      <Videos />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/video-analysis" element={
                  <ProtectedRoute>
                    <Layout>
                      <VideoAnalysis />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/video-showcase" element={
                  <ProtectedRoute>
                    <Layout>
                      <VideoShowcase />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Layout>
                      <Messages />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/history" element={
                  <ProtectedRoute>
                    <Layout>
                      <History />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/timeline" element={
                  <ProtectedRoute>
                    <Layout>
                      <Timeline />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/news" element={
                  <ProtectedRoute>
                    <Layout>
                      <News />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/contracts" element={
                  <ProtectedRoute>
                    <Layout>
                      <Contracts />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/agent-shortlist" element={
                  <ProtectedRoute>
                    <Layout>
                      <AgentShortlist />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Layout>
                      <NotificationCenter />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/notification" element={
                  <ProtectedRoute>
                    <Layout>
                      <Notification />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/user-management" element={
                  <ProtectedRoute>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
