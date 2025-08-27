
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { Home, Users, MessageCircle, FileText, History, Video, BarChart3, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/explore', label: 'Explore', icon: Users },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: '/contracts', label: 'Contracts', icon: FileText },
    { path: '/timeline', label: 'Timeline', icon: History },
    { path: '/videos', label: 'Videos', icon: Video },
    { path: '/video-analysis', label: 'Analysis', icon: BarChart3 },
  ];

  if (profile?.user_type === 'team') {
    navItems.splice(2, 0, { path: '/team-explore', label: 'Team Explore', icon: Users });
  }

  if (profile?.user_type === 'agent') {
    navItems.splice(2, 0, { path: '/agent-shortlist', label: 'Shortlist', icon: Users });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-xl font-polysans font-bold text-rosegold hover:bg-transparent"
            >
              ReelConnect
            </Button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={
                    isActive(item.path)
                      ? 'bg-rosegold text-white hover:bg-rosegold/90'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {profile?.user_type || 'Member'}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
