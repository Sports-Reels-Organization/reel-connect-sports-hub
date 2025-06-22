
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
  TrendingUp, 
  Search, 
  MessageSquare, 
  User, 
  Users,
  Settings,
  LogOut,
  Trophy,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const teamMenuItems = [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Team Profile', url: '/profile', icon: User },
    { title: 'Players', url: '/players', icon: Users },
    { title: 'Transfer Timeline', url: '/timeline', icon: TrendingUp },
    { title: 'Explore Requests', url: '/explore', icon: Search },
    { title: 'Messages', url: '/messages', icon: MessageSquare },
  ];

  const agentMenuItems = [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Agent Profile', url: '/profile', icon: User },
    { title: 'Transfer Timeline', url: '/timeline', icon: TrendingUp },
    { title: 'My Requests', url: '/explore', icon: Target },
    { title: 'Shortlist', url: '/shortlist', icon: Trophy },
    { title: 'Messages', url: '/messages', icon: MessageSquare },
  ];

  const menuItems = profile?.user_type === 'team' ? teamMenuItems : agentMenuItems;

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Sidebar className="border-r border-rosegold/20">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" 
            alt="Sports Reels" 
            className="w-8 h-8"
          />
          <h1 className="font-polysans font-bold text-xl text-rosegold">
            Sports Reels
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-polysans text-rosegold">
            {profile?.user_type === 'team' ? 'Team Management' : 'Agent Tools'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={location.pathname === item.url}
                    className="font-poppins hover:bg-rosegold/10 hover:text-rosegold data-[active=true]:bg-rosegold/20 data-[active=true]:text-rosegold"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="text-sm font-poppins text-gray-600">
            <p>{profile?.full_name}</p>
            <p className="text-xs capitalize text-rosegold">
              {profile?.user_type} Account
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full font-poppins border-rosegold text-rosegold hover:bg-rosegold hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
