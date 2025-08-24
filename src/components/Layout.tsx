
import React, { useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.user_id) {
      fetchUnreadNotifications();
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.user_id}`
          },
          () => {
            fetchUnreadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchUnreadNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search players, teams, contracts..."
                  className="pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={handleNotificationClick}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Logo */}
              <div className="flex items-center gap-2">
                <img
                  src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
                  alt="Sports Reels"
                  className="w-8 h-8"
                />
              </div>

              {/* Sign Out */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-4">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
