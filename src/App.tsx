import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Page imports
import Index from '@/pages/Index';
import Profile from '@/pages/Profile';
import Players from '@/pages/Players';
import Videos from '@/pages/Videos';
import Explore from '@/pages/Explore';
import TeamExplore from '@/pages/TeamExplore';
import Messages from '@/pages/Messages';
import Timeline from '@/pages/Timeline';
import History from '@/pages/History';
import Contracts from '@/pages/Contracts';
import Notification from '@/pages/Notification';
import News from '@/pages/News';
import PlayerProfile from '@/pages/PlayerProfile';
import VideoShowcase from '@/pages/VideoShowcase';
import UserManagement from '@/pages/UserManagement';
import NotFound from '@/pages/NotFound';
import AdminGuard from '@/components/AdminGuard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <QueryClientProvider client={new QueryClient()}>
            <Toaster />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/players" element={<Players />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/team-explore" element={<TeamExplore />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/history" element={<History />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/notification" element={<Notification />} />
              <Route path="/news" element={<News />} />
              <Route path="/player-profile/:playerId" element={<PlayerProfile />} />
              <Route path="/video-showcase" element={<VideoShowcase />} />
              <Route 
                path="/user-management" 
                element={
                  <AdminGuard>
                    <UserManagement />
                  </AdminGuard>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </QueryClientProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
