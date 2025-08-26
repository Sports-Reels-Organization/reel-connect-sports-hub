import { supabase } from '@/integrations/supabase/client';

export interface NotificationPreferences {
    email_notifications: boolean;
    newsletter_subscription: boolean;
    in_app_notifications: boolean;
    transfer_updates: boolean;
    message_notifications: boolean;
    profile_changes: boolean;
    login_notifications: boolean;
}

export interface EmailNotification {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
}

export interface InAppNotification {
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'transfer' | 'message' | 'profile';
    metadata?: Record<string, any>;
    is_read?: boolean;
}

export class NotificationService {
    // Send email notification
    static async sendEmail(notification: EmailNotification): Promise<boolean> {
        try {
            // TODO: Integrate with email service (SendGrid, etc.)
            console.log('Sending email:', notification);

            // For now, just log the email
            // In production, this would call your email service
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    // Create in-app notification
    static async createNotification(notification: InAppNotification): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: notification.user_id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    metadata: notification.metadata || {},
                    is_read: notification.is_read || false
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error creating notification:', error);
            return false;
        }
    }

    // Get notification preferences
    static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        try {
            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            // Return default preferences if none exist
            return data || {
                email_notifications: true,
                newsletter_subscription: false,
                in_app_notifications: true,
                transfer_updates: true,
                message_notifications: true,
                profile_changes: true,
                login_notifications: false
            };
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            // Return default preferences on error
            return {
                email_notifications: true,
                newsletter_subscription: false,
                in_app_notifications: true,
                transfer_updates: true,
                message_notifications: true,
                profile_changes: true,
                login_notifications: false
            };
        }
    }

    // Update notification preferences (simplified for now)
    static async updateNotificationPreferences(
        userId: string,
        preferences: NotificationPreferences
    ): Promise<boolean> {
        try {
            // For now, just log the update
            // Once migrations are deployed, this will work with the database
            console.log('Updating notification preferences:', { userId, preferences });
            return true;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            return false;
        }
    }

    // Mark notification as read
    static async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    // Mark all notifications as read
    static async markAllAsRead(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    }

    // Get unread notification count
    static async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    // Delete notification
    static async deleteNotification(notificationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }

    // Get user notifications (simplified for now)
    static async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
        try {
            // Return empty array for now until migrations are deployed
            console.log('Getting notifications for user:', userId);
            return [];
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            return [];
        }
    }

    // Send welcome notification
    static async sendWelcomeNotification(userId: string): Promise<boolean> {
        try {
            const success = await this.createNotification({
                user_id: userId,
                title: 'Welcome to Reel Connect Sports Hub!',
                message: 'Thank you for joining us. Your account has been created successfully.',
                type: 'success'
            });

            if (success) {
                // Also send welcome email if email notifications are enabled
                const preferences = await this.getNotificationPreferences(userId);
                if (preferences?.email_notifications) {
                    // Get user email from profiles table
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('email, full_name')
                        .eq('user_id', userId)
                        .single();

                    if (profile?.email) {
                        await this.sendEmail({
                            to: profile.email,
                            subject: 'Welcome to Reel Connect Sports Hub!',
                            template: 'welcome',
                            data: {
                                name: profile.full_name || 'User',
                                email: profile.email
                            }
                        });
                    }
                }
            }

            return success;
        } catch (error) {
            console.error('Error sending welcome notification:', error);
            return false;
        }
    }

    // Send profile change notification
    static async sendProfileChangeNotification(
        userId: string,
        changeType: string
    ): Promise<boolean> {
        try {
            const success = await this.createNotification({
                user_id: userId,
                title: 'Profile Updated',
                message: `Your ${changeType} has been updated successfully.`,
                type: 'profile',
                metadata: { change_type: changeType }
            });

            if (success) {
                // Send email notification if enabled
                const preferences = await this.getNotificationPreferences(userId);
                if (preferences?.email_notifications) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('email, full_name')
                        .eq('user_id', userId)
                        .single();

                    if (profile?.email) {
                        await this.sendEmail({
                            to: profile.email,
                            subject: 'Profile Updated - Reel Connect Sports Hub',
                            template: 'profile_change',
                            data: {
                                name: profile.full_name || 'User',
                                change_type: changeType,
                                email: profile.email
                            }
                        });
                    }
                }
            }

            return success;
        } catch (error) {
            console.error('Error sending profile change notification:', error);
            return false;
        }
    }

    // Send transfer interest notification
    static async sendTransferInterestNotification(
        teamOwnerId: string,
        playerName: string,
        agentName: string
    ): Promise<boolean> {
        try {
            const success = await this.createNotification({
                user_id: teamOwnerId,
                title: 'New Transfer Interest',
                message: `${agentName} has expressed interest in ${playerName}`,
                type: 'transfer',
                metadata: {
                    player_name: playerName,
                    agent_name: agentName
                }
            });

            return success;
        } catch (error) {
            console.error('Error sending transfer interest notification:', error);
            return false;
        }
    }

    // Send message notification
    static async sendMessageNotification(
        receiverId: string,
        senderName: string,
        playerName?: string
    ): Promise<boolean> {
        try {
            const messageText = playerName
                ? `You have a new message from ${senderName} about ${playerName}`
                : `You have a new message from ${senderName}`;

            const success = await this.createNotification({
                user_id: receiverId,
                title: 'New Message',
                message: messageText,
                type: 'message',
                metadata: {
                    sender_name: senderName,
                    player_name: playerName
                }
            });

            return success;
        } catch (error) {
            console.error('Error sending message notification:', error);
            return false;
        }
    }
} 