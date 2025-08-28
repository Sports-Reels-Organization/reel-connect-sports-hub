import { supabase } from '@/integrations/supabase/client';

export interface EnhancedNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  is_read: boolean;
  is_actionable: boolean;
  action_url?: string;
  action_text?: string;
  metadata?: any;
  expires_at?: string;
  created_at: string;
  read_at?: string;
  actioned_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  message_notifications: boolean;
  contract_notifications: boolean;
  pitch_notifications: boolean;
  system_notifications: boolean;
  reminder_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export class EnhancedNotificationService {
  // Get user notifications
  static async getUserNotifications(userId: string, limit = 50, offset = 0, type?: string): Promise<EnhancedNotification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
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

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
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
        .from('enhanced_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Create notification
  static async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type: string;
    category?: string;
    priority?: string;
    is_actionable?: boolean;
    action_url?: string;
    action_text?: string;
    metadata?: any;
    expires_at?: string;
  }): Promise<EnhancedNotification> {
    try {
      // Create a basic notification payload with only the columns that definitely exist
      const basicNotificationPayload = {
        user_id: notificationData.user_id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        metadata: {
          ...notificationData.metadata,
          category: notificationData.category || 'general',
          priority: notificationData.priority || 'normal',
          is_actionable: notificationData.is_actionable || false,
          action_url: notificationData.action_url,
          action_text: notificationData.action_text,
          expires_at: notificationData.expires_at
        },
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(basicNotificationPayload)
        .select()
        .single();

      if (error) {
        console.error('Error creating notification with basic payload:', error);
        
        // If that fails, try with even more basic structure
        const minimalPayload = {
          user_id: notificationData.user_id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type
        };
        
        const { data: minimalData, error: minimalError } = await supabase
          .from('notifications')
          .insert(minimalPayload)
          .select()
          .single();
          
        if (minimalError) throw minimalError;
        return minimalData;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create message notification
  static async createMessageNotification(userId: string, messageData: {
    sender_name: string;
    message_type: string;
    pitch_id?: string;
    player_id?: string;
    message_id: string;
  }): Promise<EnhancedNotification> {
    const title = 'New Message Received';
    const message = `You have received a new ${messageData.message_type} message from ${messageData.sender_name}`;
    
    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'message',
      category: 'message',
      priority: 'normal',
      is_actionable: true,
      action_url: `/messages/${messageData.message_id}`,
      action_text: 'View Message',
      metadata: {
        message_id: messageData.message_id,
        sender_name: messageData.sender_name,
        message_type: messageData.message_type,
        pitch_id: messageData.pitch_id,
        player_id: messageData.player_id
      }
    });
  }

  // Create contract notification
  static async createContractNotification(userId: string, contractData: {
    sender_name: string;
    contract_type: string;
    pitch_id?: string;
    player_id?: string;
    contract_id: string;
  }): Promise<EnhancedNotification> {
    const title = 'New Contract Received';
    const message = `You have received a new ${contractData.contract_type} contract from ${contractData.sender_name}`;
    
    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'contract',
      category: 'contract',
      priority: 'high',
      is_actionable: true,
      action_url: `/contracts/${contractData.contract_id}`,
      action_text: 'Review Contract',
      metadata: {
        contract_id: contractData.contract_id,
        sender_name: contractData.sender_name,
        contract_type: contractData.contract_type,
        pitch_id: contractData.pitch_id,
        player_id: contractData.player_id
      }
    });
  }

  // Create pitch notification
  static async createPitchNotification(userId: string, pitchData: {
    team_name: string;
    player_name: string;
    pitch_id: string;
    action_type: 'created' | 'updated' | 'expired' | 'matched';
  }): Promise<EnhancedNotification> {
    let title: string;
    let message: string;
    let priority: string;

    switch (pitchData.action_type) {
      case 'created':
        title = 'New Transfer Pitch';
        message = `${pitchData.team_name} has created a new transfer pitch for ${pitchData.player_name}`;
        priority = 'normal';
        break;
      case 'updated':
        title = 'Pitch Updated';
        message = `The transfer pitch for ${pitchData.player_name} has been updated`;
        priority = 'normal';
        break;
      case 'expired':
        title = 'Pitch Expired';
        message = `The transfer pitch for ${pitchData.player_name} has expired`;
        priority = 'low';
        break;
      case 'matched':
        title = 'Pitch Matched!';
        message = `Great news! Your transfer pitch for ${pitchData.player_name} has been matched`;
        priority = 'high';
        break;
      default:
        title = 'Pitch Update';
        message = `Update regarding the transfer pitch for ${pitchData.player_name}`;
        priority = 'normal';
    }

    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'pitch',
      category: 'transfer',
      priority,
      is_actionable: true,
      action_url: `/pitches/${pitchData.pitch_id}`,
      action_text: 'View Pitch',
      metadata: {
        pitch_id: pitchData.pitch_id,
        team_name: pitchData.team_name,
        player_name: pitchData.player_name,
        action_type: pitchData.action_type
      }
    });
  }

  // Create system notification
  static async createSystemNotification(userId: string, systemData: {
    title: string;
    message: string;
    priority?: string;
    metadata?: any;
  }): Promise<EnhancedNotification> {
    return this.createNotification({
      user_id: userId,
      title: systemData.title,
      message: systemData.message,
      type: 'system',
      category: 'system',
      priority: systemData.priority || 'normal',
      is_actionable: false,
      metadata: systemData.metadata
    });
  }

  // Create reminder notification
  static async createReminderNotification(userId: string, reminderData: {
    title: string;
    message: string;
    due_date: string;
    priority?: string;
    metadata?: any;
  }): Promise<EnhancedNotification> {
    return this.createNotification({
      user_id: userId,
      title: reminderData.title,
      message: reminderData.message,
      type: 'reminder',
      category: 'system',
      priority: reminderData.priority || 'normal',
      is_actionable: true,
      action_url: '/reminders',
      action_text: 'View Reminders',
      expires_at: reminderData.due_date,
      metadata: {
        ...reminderData.metadata,
        due_date: reminderData.due_date
      }
    });
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

  // Delete expired notifications
  static async deleteExpiredNotifications(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
      return 0;
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  // Create default notification preferences
  static async createDefaultPreferences(userId: string): Promise<boolean> {
    try {
      const defaultPreferences = {
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        message_notifications: true,
        contract_notifications: true,
        pitch_notifications: true,
        system_notifications: true,
        reminder_notifications: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_preferences')
        .insert(defaultPreferences);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return false;
    }
  }

  // Bulk create notifications for multiple users
  static async bulkCreateNotifications(notifications: Array<{
    user_id: string;
    title: string;
    message: string;
    type: string;
    category?: string;
    priority?: string;
    metadata?: any;
  }>): Promise<boolean> {
    try {
      const notificationPayloads = notifications.map(notification => ({
        ...notification,
        category: notification.category || 'general',
        priority: notification.priority || 'normal',
        is_actionable: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notificationPayloads);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk creating notifications:', error);
      return false;
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    by_type: Record<string, number>;
    by_category: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, category, is_read')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        unread: data.filter(n => !n.is_read).length,
        by_type: {} as Record<string, number>,
        by_category: {} as Record<string, number>
      };

      data.forEach(notification => {
        stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1;
        stats.by_category[notification.category] = (stats.by_category[notification.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        by_type: {},
        by_category: {}
      };
    }
  }

  // Mark notification as actioned
  static async markAsActioned(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          actioned_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as actioned:', error);
      return false;
    }
  }
}
