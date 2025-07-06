
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home,
  Users,
  Video,
  MessageSquare,
  Calendar,
  Search,
  User,
  LogOut,
  Bell,
  FileText,
  Clock,
  Newspaper,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Base menu items for both user types
  const baseMenuItems = [
    {
      title: t('dashboard'),
      url: "/",
      icon: Home,
    },
    {
      title: t('explore'),
      url: "/explore",
      icon: Search,
    },

    {
      title: t('messages'),
      url: "/messages",
      icon: MessageSquare,
    },

    {
      title: t('contracts'),
      url: "/contracts",
      icon: FileText,
    },
    {
      title: t('profile'),
      url: "/profile",
      icon: User,
    }, {
      title: t('notifications'),
      url: "/notifications",
      icon: Bell,
      showBadge: true,
    }, {
      title: 'News',
      url: "/news",
      icon: Newspaper,
    }, {
      title: 'History',
      url: "/history",
      icon: Clock,
    },
  ];

  // Agent-specific menu items
  const agentMenuItems = [
    ...baseMenuItems.slice(0, 3), // Dashboard, History, News
    {
      title: 'Shortlist',
      url: "/shortlist",
      icon: Heart,
    },

    ...baseMenuItems.slice(3), // Messages, Notifications, Contracts, Profile
  ];

  // Team-specific menu items
  const teamMenuItems = [
    ...baseMenuItems.slice(0, 1), // Dashboard
    {
      title: t('players'),
      url: "/players",
      icon: Users,
    },
    {
      title: t('videos'),
      url: "/videos",
      icon: Video,
    },
    {
      title: t('timeline'),
      url: "/timeline",
      icon: Calendar,
    },
    ...baseMenuItems.slice(1), // History, News, Messages, Notifications, Contracts, Profile
  ];

  // Get appropriate menu items based on user type
  const getMenuItems = () => {
    if (profile?.user_type === 'agent') {
      return agentMenuItems;
    }
    return teamMenuItems;
  };

  const menuItems = getMenuItems();

  useEffect(() => {
    if (profile?.user_id) {
      fetchUnreadNotifications();
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
      setUnreadNotifications(data?.length || 0);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

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
    <Sidebar className="border-sidebar-border">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
            alt="Sports Reels"
            className="w-10 h-10"
          />
          <div>
            <h2 className="font-polysans text-xl font-bold text-sidebar-foreground">
              Sports Reels
            </h2>
            <p className="text-sm text-sidebar-foreground/70">
              {profile?.user_type === 'team' ? t('teamDashboard') : t('agentDashboard')}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                      {item.showBadge && unreadNotifications > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {unreadNotifications}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-0 border-sidebar-border">
        <div className="space-y-4">
          <SidebarMenuButton
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>{t('signOut')}</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
