
import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Home,
  Users,
  Video,
  Clock,
  Search,
  MessageSquare,
  User,
  FileText,
  History,
  Bell,
  Newspaper,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AppSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const unreadCount = 3;
  const notificationCount = 8;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const navigationItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Players",
      url: "/players",
      icon: Users,
    },
    {
      title: "Videos",
      url: "/videos", 
      icon: Video,
    },
    {
      title: "Timeline",
      url: "/timeline",
      icon: Clock,
    },
    {
      title: "Explore",
      url: profile?.user_type === 'team' ? "/team-explore" : "/explore",
      icon: Search,
      badge: profile?.user_type === 'team' ? "Team" : "Agent",
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount.toString() : undefined,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Contracts",
      url: "/contracts",
      icon: FileText,
    },
    {
      title: "History",
      url: "/history",
      icon: History,
    },
    {
      title: "Notification",
      url: "/notification",
      icon: Bell,
      badge: notificationCount > 0 ? notificationCount.toString() : undefined,
    },
    {
      title: "News",
      url: "/news",
      icon: Newspaper,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[280px] bg-gray-900 text-white">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate through the application using the options below.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {navigationItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-left"
              onClick={() => {
                navigate(item.url);
                setOpen(false); // Close the sidebar after navigation
              }}
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                {item.title}
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-secondary rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>
        <div className="border-t border-gray-700 my-2"></div>
        <div className="grid gap-2 py-2">
          <Button variant="ghost" className="w-full justify-start text-left">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-left">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Help
            </div>
          </Button>
        </div>
        <div className="border-t border-gray-700 my-2"></div>
        <Button
          variant="ghost"
          className="w-full justify-start text-left text-red-500 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </div>
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
