
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Users, 
  UserPlus, 
  TrendingUp, 
  Search, 
  MessageCircle, 
  Bookmark,
  Settings,
  Crown
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const { user } = useAuth();

  const teamMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Team Profile", url: "/team-profile", icon: Users },
    { title: "Players", url: "/players", icon: UserPlus },
    { title: "Transfer Timeline", url: "/transfer-timeline", icon: TrendingUp },
    { title: "Messages", url: "/messages", icon: MessageCircle },
  ];

  const agentMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Agent Profile", url: "/agent-profile", icon: Users },
    { title: "Explore", url: "/explore", icon: Search },
    { title: "Shortlist", url: "/shortlist", icon: Bookmark },
    { title: "Messages", url: "/messages", icon: MessageCircle },
  ];

  const menuItems = user?.userType === 'team' ? teamMenuItems : agentMenuItems;

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/0cf6e8a1-48bf-4acb-b44c-8c575d36ebc4.png" 
            alt="Sports Reels Logo" 
            className="w-10 h-10"
          />
          <div>
            <h2 className="font-polysans font-bold text-lg text-black">Sports Reels</h2>
            <p className="text-xs text-rosegold">Sports Data Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="font-polysans text-rosegold">
            {user?.userType === 'team' ? 'Team Management' : 'Agent Tools'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-rosegold hover:text-white transition-colors">
                    <a href={item.url} className="flex items-center gap-3 p-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-poppins">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-polysans text-rosegold">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-rosegold hover:text-white transition-colors">
                  <a href="/settings" className="flex items-center gap-3 p-3">
                    <Settings className="w-5 h-5" />
                    <span className="font-poppins">Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="bg-gradient-to-r from-rosegold to-bright-pink p-4 rounded-lg text-white">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" />
            <span className="font-polysans font-semibold">Premium Access</span>
          </div>
          <p className="text-xs opacity-90 mb-3">
            Unlock advanced features and unlimited transfers
          </p>
          <button className="w-full bg-white text-rosegold py-2 px-4 rounded-md text-sm font-medium hover:shadow-lg transition-shadow">
            Upgrade Now
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
