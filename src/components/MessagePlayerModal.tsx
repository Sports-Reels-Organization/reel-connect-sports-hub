
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;

interface MessagePlayerModalProps {
  player: DatabasePlayer;
  isOpen: boolean;
  onClose: () => void;
}

const MessagePlayerModal: React.FC<MessagePlayerModalProps> = ({
  player,
  isOpen,
  onClose
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  });

  const handleSendMessage = async () => {
    if (!profile || !formData.subject || !formData.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get team profile for the player
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('profile_id')
        .eq('id', player.team_id)
        .single();

      if (teamError || !teamData) {
        throw new Error('Could not find team for this player');
      }

      // Send message
      const { error } = await supabase
        .from('player_messages')
        .insert({
          sender_id: profile.id,
          receiver_id: teamData.profile_id,
          player_id: player.id,
          subject: formData.subject,
          content: formData.content,
          message_type: 'player_inquiry'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });

      setFormData({ subject: '', content: '' });
      onClose();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white font-polysans">
            Message about {player.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-white">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="e.g., Interest in Transfer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">Message</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              placeholder="Express your interest in the player..."
              rows={6}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={loading}
              className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagePlayerModal;
