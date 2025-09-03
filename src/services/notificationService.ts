import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationData {
  id: string;
  type: 'message' | 'contract_update' | 'transfer_update' | 'system';
  title: string;
  description: string;
  data?: any;
  created_at: string;
  read: boolean;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  contract_updates: boolean;
  transfer_updates: boolean;
  message_notifications: boolean;
  newsletter_subscription: boolean;
  in_app_notifications: boolean;
  profile_changes: boolean;
  login_notifications: boolean;
}

export class NotificationService {
  private subscriptions: Map<string, any> = new Map();
  private toast: any = null;

  setToast(toast: any) {
    this.toast = toast;
  }

  // Subscribe to contract messages
  subscribeToContractMessages(contractId: string, onMessage: (message: any) => void) {
    const channelName = `contract-messages-${contractId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contract_messages',
          filter: `contract_id=eq.${contractId}`
        },
        (payload) => {
          console.log('New contract message:', payload);
          onMessage(payload.new);
          
          if (this.toast) {
            this.toast({
              title: "New Message",
              description: "You have a new message in the contract discussion",
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Contract messages subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to contract updates
  subscribeToContractUpdates(contractId: string, onUpdate: (contract: any) => void) {
    const channelName = `contract-updates-${contractId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`
        },
        (payload) => {
          console.log('Contract updated:', payload);
          onUpdate(payload.new);
          
          if (this.toast) {
            this.toast({
              title: "Contract Updated",
              description: "The contract has been updated",
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Contract updates subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to user notifications
  subscribeToUserNotifications(userId: string, onNotification: (notification: NotificationData) => void) {
    const channelName = `user-notifications-${userId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          onNotification(payload.new as NotificationData);
          
          if (this.toast) {
            this.toast({
              title: payload.new.title,
              description: payload.new.description,
              duration: 5000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`User notifications subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to transfer updates
  subscribeToTransferUpdates(transferId: string, onUpdate: (transfer: any) => void) {
    const channelName = `transfer-updates-${transferId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfer_pitches',
          filter: `id=eq.${transferId}`
        },
        (payload) => {
          console.log('Transfer updated:', payload);
          onUpdate(payload.new);
          
          if (this.toast) {
            this.toast({
              title: "Transfer Update",
              description: "A transfer you're involved in has been updated",
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Transfer updates subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // Create a notification
  async createNotification(notification: Omit<NotificationData, 'id' | 'created_at' | 'read'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error.message?.includes('relation "notifications" does not exist')) {
          console.warn('Notifications table does not exist yet. Please run the database setup script.');
          return [];
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        // If table doesn't exist, return 0 instead of throwing
        if (error.message?.includes('relation "notifications" does not exist')) {
          console.warn('Notifications table does not exist yet. Please run the database setup script.');
          return 0;
        }
        throw error;
      }
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
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

  // Get notification preferences (placeholder - you may need to implement this based on your schema)
  async getNotificationPreferences(userId: string) {
    try {
      // This is a placeholder - you may need to implement this based on your actual schema
      // For now, return default preferences
      return {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        contract_updates: true,
        transfer_updates: true,
        message_notifications: true,
        newsletter_subscription: false,
        in_app_notifications: true,
        profile_changes: true,
        login_notifications: false
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences (placeholder - you may need to implement this based on your schema)
  async updateNotificationPreferences(userId: string, preferences: any) {
    try {
      // This is a placeholder - you may need to implement this based on your actual schema
      // For now, just return true
      console.log('Updating preferences for user:', userId, preferences);
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();