
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const NotificationBell: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/notifications');
  };

  if (!profile) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative p-2 hover:bg-gray-800 transition-colors group"
      onClick={handleClick}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-white" />
      
      {/* Simple badge - can be enhanced later */}
      <Badge 
        variant="secondary"
        className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold min-w-[24px] shadow-lg"
      >
        0
      </Badge>
    </Button>
  );
};

export default NotificationBell;
