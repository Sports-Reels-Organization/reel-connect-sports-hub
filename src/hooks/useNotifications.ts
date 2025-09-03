import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notificationService, NotificationData } from '@/services/notificationService';

export const useNotifications = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Set up toast for notification service
  useEffect(() => {
    notificationService.setToast(toast);
  }, [toast]);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        notificationService.getUserNotifications(profile.user_id),
        notificationService.getUnreadCount(profile.user_id)
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!profile?.user_id) return;

    const channel = notificationService.subscribeToUserNotifications(
      profile.user_id,
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => {
      notificationService.unsubscribe(`user-notifications-${profile.user_id}`);
    };
  }, [profile?.user_id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!profile?.user_id) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification => 
          notificationService.markAsRead(notification.id)
        )
      );
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications, profile?.user_id]);

  // Create a notification
  const createNotification = useCallback(async (
    type: NotificationData['type'],
    title: string,
    description: string,
    data?: any
  ) => {
    if (!profile?.user_id) return;

    try {
      const notification = await notificationService.createNotification({
        type,
        title,
        description,
        data,
        user_id: profile.user_id
      });
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, [profile?.user_id]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications: loadNotifications
  };
};

// Hook for contract-specific notifications
export const useContractNotifications = (contractId: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!contractId || !profile?.user_id) return;

    // Subscribe to contract messages
    const messageChannel = notificationService.subscribeToContractMessages(
      contractId,
      (message) => {
        // Only show notification if message is not from current user
        if (message.sender_id !== profile.id) {
          toast({
            title: "New Message",
            description: "You have a new message in the contract discussion",
            duration: 3000,
          });
        }
      }
    );

    // Subscribe to contract updates
    const updateChannel = notificationService.subscribeToContractUpdates(
      contractId,
      (contract) => {
        toast({
          title: "Contract Updated",
          description: "The contract has been updated",
          duration: 3000,
        });
      }
    );

    // Check connection status
    const checkConnection = () => {
      setIsConnected(true);
    };

    checkConnection();

    return () => {
      notificationService.unsubscribe(`contract-messages-${contractId}`);
      notificationService.unsubscribe(`contract-updates-${contractId}`);
    };
  }, [contractId, profile?.user_id, profile?.id, toast]);

  return {
    isConnected
  };
};

// Hook for transfer-specific notifications
export const useTransferNotifications = (transferId: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!transferId || !profile?.user_id) return;

    // Subscribe to transfer updates
    const channel = notificationService.subscribeToTransferUpdates(
      transferId,
      (transfer) => {
        toast({
          title: "Transfer Update",
          description: "A transfer you're involved in has been updated",
          duration: 3000,
        });
      }
    );

    setIsConnected(true);

    return () => {
      notificationService.unsubscribe(`transfer-updates-${transferId}`);
    };
  }, [transferId, profile?.user_id, toast]);

  return {
    isConnected
  };
};