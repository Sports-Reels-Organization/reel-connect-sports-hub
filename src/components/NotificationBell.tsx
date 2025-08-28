
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const NotificationBell: React.FC = () => {
  const { profile } = useAuth();
  const { unreadCount, notifications } = useEnhancedNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/notifications');
  };

  // Get important notifications for immediate attention
  const importantNotifications = notifications.filter(n => n.type === 'contract' || n.type === 'message');

  // Show different badge colors based on notification type
  const getBadgeVariant = () => {
    if (unreadCount > 0) return 'default';
    return 'secondary';
  };

  const getBadgeContent = () => {
    if (unreadCount > 0) return unreadCount > 99 ? '99+' : unreadCount;
    return '';
  };

  // Debug logging
  React.useEffect(() => {
    console.log('NotificationBell - unreadCount:', unreadCount);
    console.log('NotificationBell - total notifications:', notifications.length);
  }, [unreadCount, notifications.length]);

  if (!profile) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative p-2 hover:bg-gray-800 transition-colors group"
      onClick={handleClick}
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      <Bell className="h-5 w-5 text-white" />
      
      {/* Enhanced Badge showing unread count with better visibility */}
      {unreadCount > 0 && (
        <Badge 
          variant={getBadgeVariant()}
          className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold min-w-[24px] shadow-lg animate-pulse"
        >
          {getBadgeContent()}
        </Badge>
      )}
      
      {/* Enhanced Tooltip for important notifications */}
      {importantNotifications.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="p-3">
            <div className="text-sm font-medium text-white mb-2">
              Recent Notifications
            </div>
            <div className="space-y-2">
              {importantNotifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="text-xs text-gray-300">
                  <div className="font-medium">{notification.title}</div>
                  <div className="truncate">{notification.message}</div>
                </div>
              ))}
              {importantNotifications.length > 3 && (
                <div className="text-xs text-gray-400">
                  +{importantNotifications.length - 3} more...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Button>
  );
};

export default NotificationBell;
