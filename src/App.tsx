import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Players from "./pages/Players";
import Videos from "./pages/Videos";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Timeline from "./pages/Timeline";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";
import Notification from "./pages/Notification";
import Contracts from "./pages/Contracts";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/players" element={<Players />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/notifications" element={<Notification />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
