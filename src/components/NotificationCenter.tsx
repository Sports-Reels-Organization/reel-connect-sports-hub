import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Bell,
    Check,
    Trash2,
    Settings,
    MessageSquare,
    User,
    TrendingUp,
    Clock,
    X
} from 'lucide-react';
import { NotificationService, NotificationPreferences } from '@/services/notificationService';
import { Json } from '@/integrations/supabase/types';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    metadata?: Json;
}

const NotificationCenter: React.FC = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (profile?.user_id) {
            fetchNotifications();
            fetchPreferences();
        }
    }, [profile]);

    const fetchNotifications = async () => {
        if (!profile?.user_id) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.user_id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast({
                title: "Error",
                description: "Failed to fetch notifications",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPreferences = async () => {
        if (!profile?.user_id) return;

        try {
            const prefs = await NotificationService.getNotificationPreferences(profile.user_id);
            setPreferences(prefs);
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const success = await NotificationService.markAsRead(notificationId);
            if (success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId
                            ? { ...notif, is_read: true }
                            : notif
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!profile?.user_id) return;

        try {
            const success = await NotificationService.markAllAsRead(profile.user_id);
            if (success) {
                setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
                toast({
                    title: "Success",
                    description: "All notifications marked as read",
                });
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast({
                title: "Error",
                description: "Failed to mark notifications as read",
                variant: "destructive"
            });
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            const success = await NotificationService.deleteNotification(notificationId);
            if (success) {
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                toast({
                    title: "Success",
                    description: "Notification deleted",
                });
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast({
                title: "Error",
                description: "Failed to delete notification",
                variant: "destructive"
            });
        }
    };

    const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!profile?.user_id || !preferences) return;

        try {
            const updatedPrefs = { ...preferences, [key]: value };
            const success = await NotificationService.updateNotificationPreferences(
                profile.user_id,
                updatedPrefs
            );

            if (success) {
                setPreferences(updatedPrefs);
                toast({
                    title: "Success",
                    description: "Notification preferences updated",
                });
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            toast({
                title: "Error",
                description: "Failed to update preferences",
                variant: "destructive"
            });
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'transfer':
                return <TrendingUp className="h-4 w-4 text-blue-400" />;
            case 'message':
                return <MessageSquare className="h-4 w-4 text-green-400" />;
            case 'profile':
                return <User className="h-4 w-4 text-purple-400" />;
            case 'success':
                return <Check className="h-4 w-4 text-green-400" />;
            case 'warning':
                return <Bell className="h-4 w-4 text-yellow-400" />;
            case 'error':
                return <X className="h-4 w-4 text-red-400" />;
            default:
                return <Bell className="h-4 w-4 text-gray-400" />;
        }
    };

    const getNotificationBadge = (type: string) => {
        switch (type) {
            case 'transfer':
                return <Badge variant="outline" className="text-blue-400 border-blue-400">Transfer</Badge>;
            case 'message':
                return <Badge variant="outline" className="text-green-400 border-green-400">Message</Badge>;
            case 'profile':
                return <Badge variant="outline" className="text-purple-400 border-purple-400">Profile</Badge>;
            case 'success':
                return <Badge variant="outline" className="text-green-400 border-green-400">Success</Badge>;
            case 'warning':
                return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Warning</Badge>;
            case 'error':
                return <Badge variant="outline" className="text-red-400 border-red-400">Error</Badge>;
            default:
                return <Badge variant="outline" className="text-gray-400 border-gray-400">Info</Badge>;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    const filteredNotifications = notifications.filter(notification => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unread') return !notification.is_read;
        return notification.type === activeTab;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <Card className="border-gray-700">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-16 bg-gray-700 rounded"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-polysans font-bold text-white mb-2">
                        Notifications
                    </h1>
                    <p className="text-gray-400 font-poppins">
                        Stay updated with your latest activities and messages
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={markAllAsRead}
                        variant="outline"
                        className="border-rosegold text-rosegold hover:bg-rosegold hover:text-white"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Mark All Read
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 bg-card border-0">
                    <TabsTrigger value="all" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                        All ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                        Unread ({unreadCount})
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                        Transfers
                    </TabsTrigger>
                    <TabsTrigger value="message" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                        Messages
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                        <Settings className="h-4 w-4" />
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            getNotificationIcon={getNotificationIcon}
                            getNotificationBadge={getNotificationBadge}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            getNotificationIcon={getNotificationIcon}
                            getNotificationBadge={getNotificationBadge}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="transfer" className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            getNotificationIcon={getNotificationIcon}
                            getNotificationBadge={getNotificationBadge}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="message" className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            getNotificationIcon={getNotificationIcon}
                            getNotificationBadge={getNotificationBadge}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card className="border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white font-polysans">Notification Preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {preferences && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-white">Email Notifications</Label>
                                                <p className="text-sm text-gray-400">Receive notifications via email</p>
                                            </div>
                                            <Switch
                                                checked={preferences.email_notifications}
                                                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-white">Newsletter Subscription</Label>
                                                <p className="text-sm text-gray-400">Receive our newsletter and updates</p>
                                            </div>
                                            <Switch
                                                checked={preferences.newsletter_subscription}
                                                onCheckedChange={(checked) => updatePreference('newsletter_subscription', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-white">In-App Notifications</Label>
                                                <p className="text-sm text-gray-400">Show notifications within the app</p>
                                            </div>
                                            <Switch
                                                checked={preferences.in_app_notifications}
                                                onCheckedChange={(checked) => updatePreference('in_app_notifications', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-white">Transfer Updates</Label>
                                                <p className="text-sm text-gray-400">Notifications about transfer interest</p>
                                            </div>
                                            <Switch
                                                checked={preferences.transfer_updates}
                                                onCheckedChange={(checked) => updatePreference('transfer_updates', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-white">Message Notifications</Label>
                                                <p className="text-sm text-gray-400">Notifications about new messages</p>
                                            </div>
                                            <Switch
                                                checked={preferences.message_notifications}
                                                onCheckedChange={(checked) => updatePreference('message_notifications', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-white">Profile Changes</Label>
                                                <p className="text-sm text-gray-400">Notifications about profile updates</p>
                                            </div>
                                            <Switch
                                                checked={preferences.profile_changes}
                                                onCheckedChange={(checked) => updatePreference('profile_changes', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-white">Login Notifications</Label>
                                                <p className="text-sm text-gray-400">Get notified when you log in</p>
                                            </div>
                                            <Switch
                                                checked={preferences.login_notifications}
                                                onCheckedChange={(checked) => updatePreference('login_notifications', checked)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {filteredNotifications.length === 0 && activeTab !== 'settings' && (
                <Card className="border-gray-700">
                    <CardContent className="p-12 text-center">
                        <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                        <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                            No Notifications
                        </h3>
                        <p className="text-gray-400 font-poppins">
                            {activeTab === 'unread'
                                ? "You're all caught up! No unread notifications."
                                : "No notifications to display."
                            }
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
    getNotificationIcon: (type: string) => React.ReactNode;
    getNotificationBadge: (type: string) => React.ReactNode;
    formatTimeAgo: (dateString: string) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onDelete,
    getNotificationIcon,
    getNotificationBadge,
    formatTimeAgo
}) => {
    return (
        <Card className={`border-gray-700 ${!notification.is_read ? 'bg-gray-800/50' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-polysans font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                                        {notification.title}
                                    </h4>
                                    {getNotificationBadge(notification.type)}
                                </div>
                                <p className="text-gray-400 text-sm mb-2">
                                    {notification.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeAgo(notification.created_at)}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {!notification.is_read && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onMarkAsRead(notification.id)}
                                        className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDelete(notification.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default NotificationCenter; 