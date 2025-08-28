import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  pitch_id?: string;
  player_id?: string;
  content: string;
  message_type: string;
  subject?: string;
  contract_file_url?: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
  is_flagged?: boolean;
  sender_profile?: {
    full_name: string;
    user_type: string;
    logo_url?: string;
  };
  receiver_profile?: {
    full_name: string;
    user_type: string;
    logo_url?: string;
  };
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface ContractTemplate {
  id: string;
  template_name: string;
  template_type: string;
  sport_type: string;
  template_content: string;
  variables: Record<string, string>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedContract {
  id: string;
  template_id?: string;
  pitch_id?: string;
  sender_id: string;
  receiver_id: string;
  player_id?: string;
  contract_content: string;
  contract_data: Record<string, any>;
  status: string;
  file_url?: string;
  sent_at?: string;
  reviewed_at?: string;
  signed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export class EnhancedMessagingService {
  // Fetch messages for a specific pitch or player
  static async getMessages(pitchId?: string, playerId?: string, limit = 50): Promise<EnhancedMessage[]> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            full_name,
            user_type,
            logo_url
          ),
          receiver_profile:profiles!messages_receiver_id_fkey(
            full_name,
            user_type,
            logo_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (pitchId) {
        query = query.eq('pitch_id', pitchId);
      }
      if (playerId) {
        query = query.eq('player_id', playerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a new message
  static async sendMessage(messageData: {
    receiver_id: string;
    pitch_id?: string;
    player_id?: string;
    content: string;
    message_type?: string;
    subject?: string;
    contract_file_url?: string;
  }): Promise<EnhancedMessage> {
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const messagePayload = {
        ...messageData,
        sender_id: profile.id,
        message_type: messageData.message_type || 'general',
        created_at: new Date().toISOString(),
        status: 'sent'
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messagePayload)
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            full_name,
            user_type,
            logo_url
          ),
          receiver_profile:profiles!messages_receiver_id_fkey(
            full_name,
            user_type,
            logo_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  static async markAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  // Get contract templates
  static async getContractTemplates(sportType?: string): Promise<ContractTemplate[]> {
    try {
      let query = supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (sportType) {
        query = query.eq('sport_type', sportType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching contract templates:', error);
      throw error;
    }
  }

  // Generate contract from template
  static async generateContract(templateId: string, variables: Record<string, string>, receiverId: string, pitchId?: string, playerId?: string): Promise<GeneratedContract> {
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get template
      const { data: template } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!template) throw new Error('Template not found');

      // Replace variables in template content
      let contractContent = template.template_content;
      Object.entries(variables).forEach(([key, value]) => {
        contractContent = contractContent.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      const contractPayload = {
        template_id: templateId,
        pitch_id: pitchId,
        sender_id: profile.id,
        receiver_id: receiverId,
        player_id: playerId,
        contract_content: contractContent,
        contract_data: variables,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('generated_contracts')
        .insert(contractPayload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  }

  // Send contract
  static async sendContract(contractId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('generated_contracts')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending contract:', error);
      return false;
    }
  }

  // Update contract status
  static async updateContractStatus(contractId: string, status: string, notes?: string): Promise<boolean> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'reviewed') {
        updateData.reviewed_at = new Date().toISOString();
      } else if (status === 'signed') {
        updateData.signed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('generated_contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;

      // Record negotiation action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('contract_negotiations')
            .insert({
              contract_id: contractId,
              negotiator_id: profile.id,
              action_type: status === 'signed' ? 'accept' : 'modify',
              action_details: { status, notes },
              created_at: new Date().toISOString()
            });
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating contract status:', error);
      return false;
    }
  }

  // Upload contract file
  static async uploadContractFile(file: File, contractId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${contractId}_${Date.now()}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      // Update contract with file URL
      await supabase
        .from('generated_contracts')
        .update({ 
          file_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading contract file:', error);
      throw error;
    }
  }

  // Get user's contracts
  static async getUserContracts(userId: string, status?: string): Promise<GeneratedContract[]> {
    try {
      let query = supabase
        .from('generated_contracts')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user contracts:', error);
      throw error;
    }
  }

  // Block user
  static async blockUser(blockedUserId: string, reason?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: profile.id,
          blocked_id: blockedUserId,
          reason,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  // Check if user is blocked
  static async isUserBlocked(userId1: string, userId2: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking user block status:', error);
      return false;
    }
  }

  // Get team profile
  static async getTeamProfile(teamId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, profile_id')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching team profile:', error);
      throw error;
    }
  }

  // Get message threads
  static async getMessageThreads(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          thread_participants!inner(
            profile_id
          )
        `)
        .eq('thread_participants.profile_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message threads:', error);
      throw error;
    }
  }

  // Create message thread
  static async createMessageThread(threadData: {
    thread_type: string;
    pitch_id?: string;
    player_id?: string;
    title?: string;
    participants: string[];
  }): Promise<string> {
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          ...threadData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add participants
      const participants = [profile.id, ...threadData.participants];
      const participantData = participants.map(participantId => ({
        thread_id: thread.id,
        profile_id: participantId,
        role: participantId === profile.id ? 'initiator' : 'participant',
        joined_at: new Date().toISOString()
      }));

      const { error: participantError } = await supabase
        .from('thread_participants')
        .insert(participantData);

      if (participantError) throw participantError;

      return thread.id;
    } catch (error) {
      console.error('Error creating message thread:', error);
      throw error;
    }
  }

  // Get unread message count
  static async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  // Delete message
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false
    }
  }

  // Update message
  static async updateMessage(messageId: string, updates: Partial<EnhancedMessage>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating message:', error);
      return false;
    }
  }
}
