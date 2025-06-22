
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <img 
                src="/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png" 
                alt="Sports Reels" 
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="w-8 h-8 text-rosegold" />
                )}
                <span className="font-medium text-gray-900">{user.name}</span>
                <span className="text-xs bg-rosegold text-white px-2 py-1 rounded-full font-polysans">
                  {user.userType === 'team' ? 'Team' : 'Agent'}
                </span>
              </div>
              <Button 
                onClick={logout} 
                variant="outline" 
                size="sm"
                className="text-rosegold border-rosegold hover:bg-rosegold hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
