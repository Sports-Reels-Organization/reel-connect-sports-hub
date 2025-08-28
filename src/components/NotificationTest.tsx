import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const NotificationTest: React.FC = () => {
  const { profile } = useAuth();
  const { createNotification } = useEnhancedNotifications();
  const { toast } = useToast();

  const testNotification = async () => {
    if (!profile?.user_id) return;

    try {
      console.log("Creating test notification for user:", profile.user_id);
      console.log("Profile data:", profile);
      
      // Create a test notification
      await createNotification({
        title: "Test Notification",
        message: "This is a test notification to verify the system is working",
        type: "test",
        action_url: "/notifications",
        action_text: "View"
      });

      console.log("Test notification created successfully");
      toast({
        title: "Test Notification Created",
        description: "Test notification created successfully. Check the notification count in header.",
      });
    } catch (error) {
      console.error("Error creating test notification:", error);
      toast({
        title: "Test Notification Error",
        description: error instanceof Error ? error.message : "Failed to create test notification",
        variant: "destructive"
      });
    }
  };

  const testMessage = async () => {
    if (!profile?.user_id) return;

    try {
      // First, verify that the user exists in the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profile.user_id)
        .single();

      if (profileError || !profileData) {
        console.error("User profile not found:", profileError);
        toast({
          title: "Test Message Error",
          description: "User profile not found. Please check your authentication.",
          variant: "destructive"
        });
        return;
      }

      // Send a test message to yourself with unique content to avoid conflicts
      const timestamp = new Date().toISOString();
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: `This is a test message to verify the messaging system - ${timestamp}`,
          sender_id: profile.user_id,
          receiver_id: profile.user_id,
          message_type: 'general',
          status: 'sent',
          created_at: timestamp
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending test message:", error);
        // Show error in toast
        toast({
          title: "Test Message Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("Test message sent successfully:", data);
        toast({
          title: "Test Message Sent",
          description: "Test message sent successfully. Check for notification.",
        });
      }
    } catch (error) {
      console.error("Error in test message:", error);
      toast({
        title: "Test Message Error",
        description: "Failed to send test message",
        variant: "destructive"
      });
    }
  };

  if (!profile) return null;

  return (
    <div className="p-4 space-y-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white">Notification System Test</h3>
      <div className="space-y-2">
        <Button onClick={testNotification} variant="outline" className="w-full">
          Test Notification
        </Button>
        <Button onClick={testMessage} variant="outline" className="w-full">
          Test Message
        </Button>
      </div>
      <p className="text-sm text-gray-400">
        Use these buttons to test the notification and messaging systems.
        Check the console for logs and look for toast notifications.
      </p>
    </div>
  );
};

export default NotificationTest;
