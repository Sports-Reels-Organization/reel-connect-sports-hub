
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, signOut, loading } = useAuth();
  const { t } = useLanguage();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, just render children (for auth pages)
  if (!user) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="bg-card border-b border-border px-6 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <img
                  src="/lovable-uploads/91e56af4-3e68-49dc-831b-edf66e971f92.png"
                  alt="Sports Reels"
                  className="w-[60px] h-[60px]"
                />
              </div>
              <div className="flex items-center gap-4">
                {/* Language Selector */}
                <LanguageSelector variant="button" showFlag={true} />

                <div className="flex items-center gap-2">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      className='w-[30px] h-[30px] rounded-[50%] object-cover' 
                      src={user.user_metadata.avatar_url} 
                      alt="User avatar"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">
                    {profile?.user_type === 'team' ? 'Team' : 'Scout'}
                  </span>
                </div>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </header>
            <main className="flex-1">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
};

export default Layout;
