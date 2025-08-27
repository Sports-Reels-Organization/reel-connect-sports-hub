
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Check, CheckCheck, MessageCircle, Transfer, FileText, Settings, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'transfer':
        return <Transfer className="w-5 h-5 text-green-500" />;
      case 'contract':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (isRead: boolean) => {
    return isRead ? 'bg-gray-800/30' : 'bg-blue-900/20 border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-gray-700 bg-gray-800/50">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-700 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white">Notifications</h1>
            <p className="text-gray-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-rosegold hover:bg-rosegold/90' : 'text-gray-400 hover:text-white'}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className={filter === 'unread' ? 'bg-rosegold hover:bg-rosegold/90' : 'text-gray-400 hover:text-white'}
              >
                Unread ({unreadCount})
              </Button>
            </div>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h3>
                <p className="text-gray-400">
                  {filter === 'unread' 
                    ? 'All notifications have been read'
                    : "You're all caught up! New notifications will appear here."
                  }
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="divide-y divide-gray-700">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-700/30 transition-colors ${getNotificationBgColor(notification.is_read)}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {!notification.is_read && (
                                <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                  New
                                </Badge>
                              )}
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-2">
                            {notification.message}
                          </p>
                          
                          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                            <div className="text-xs text-gray-400 mb-2">
                              {notification.metadata.sender_name && (
                                <span>From: {notification.metadata.sender_name}</span>
                              )}
                              {notification.metadata.player_name && (
                                <span className="ml-3">Player: {notification.metadata.player_name}</span>
                              )}
                            </div>
                          )}
                          
                          {!notification.is_read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationCenter;
