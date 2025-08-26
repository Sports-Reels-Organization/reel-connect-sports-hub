
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import Videos from '@/pages/Videos';
import VideoShowcase from '@/pages/VideoShowcase';
import VideoAnalysis from '@/pages/VideoAnalysis';
import Players from '@/pages/Players';
import PlayerProfile from '@/pages/PlayerProfile';
import Explore from '@/pages/Explore';
import AgentShortlist from '@/pages/AgentShortlist';
import History from '@/pages/History';
import News from '@/pages/News';
import Timeline from '@/pages/Timeline';
import Contracts from '@/pages/Contracts';
import Notification from '@/pages/Notification';
import UserManagement from '@/pages/UserManagement';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/messages',
    element: <Messages />,
  },
  {
    path: '/videos',
    element: <Videos />,
  },
  {
    path: '/video-showcase',
    element: <VideoShowcase />,
  },
  {
    path: '/video-analysis/:videoId',
    element: <VideoAnalysis />,
  },
  {
    path: '/players',
    element: <Players />,
  },
  {
    path: '/player/:playerId',
    element: <PlayerProfile />,
  },
  {
    path: '/player-profile/:playerId',
    element: <PlayerProfile />,
  },
  {
    path: '/explore',
    element: <Explore />,
  },
  {
    path: '/shortlist',
    element: <AgentShortlist />,
  },
  {
    path: '/history',
    element: <History />,
  },
  {
    path: '/news',
    element: <News />,
  },
  {
    path: '/timeline',
    element: <Timeline />,
  },
  {
    path: '/contracts',
    element: <Contracts />,
  },
  {
    path: '/notifications',
    element: <Notification />,
  },
  {
    path: '/admin/users',
    element: <UserManagement />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
