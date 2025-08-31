import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  MessageCircle, FileText, Send, Clock, User, Video, DollarSign,
  TrendingUp, AlertCircle, CheckCircle, X, Plus, Search, Heart, Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedCommunicationHubProps {
  pitchId?: string;
  playerId?: string;
  receiverId?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  pitch_id?: string;
  player_id?: string;
  message_type: string;
  created_at: string;
  read_at?: string;
  sender_profile: {
    full_name: string;
    user_type: string;
  };
  receiver_profile: {
    full_name: string;
    user_type: string;
  };
}

interface Contract {
  id: string;
  status: string;
  deal_stage: string;
  contract_value: number;
  currency: string;
  created_at: string;
  last_activity: string;
}

interface AgentInterest {
  id: string;
  pitch_id: string;
  agent_id: string;
  status: 'interested' | 'requested' | 'negotiating';
  message?: string;
  created_at: string;
  pitch: {
    players: {
      full_name: string;
      position: string;
    };
    teams: {
      team_name: string;
    };
    asking_price: number;
    currency: string;
  };
}

const UnifiedCommunicationHub: React.FC<UnifiedCommunicationHubProps> = ({
  pitchId,
  playerId,
  receiverId
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'messages' | 'contracts' | 'interest'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [agentInterest, setAgentInterest] = useState<AgentInterest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (pitchId || playerId) {
      fetchMessages();
      fetchContracts();
      fetchAgentInterest();
    } else {
      // If no specific pitch/player, fetch all communications for the user
      fetchAllCommunications();
    }
  }, [pitchId, playerId]);

  const fetchAllCommunications = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Fetch messages where user is sender or receiver
      const { data: messages, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(full_name, user_type),
          receiver_profile:profiles!messages_receiver_id_fkey(full_name, user_type)
        `)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (messageError) throw messageError;

      // Fetch agent interest for teams
      if (profile.user_type === 'team') {
        const { data: interest, error: interestError } = await supabase
          .from('agent_interest')
          .select(`
            *,
            agent:agents!agent_interest_agent_id_fkey(
              profile:profiles!agents_profile_id_fkey(full_name, user_type)
            ),
            pitch:transfer_pitches!agent_interest_pitch_id_fkey(
              players!inner(full_name, position),
              teams!inner(team_name),
              asking_price,
              currency
            )
          `)
          .eq('pitch.teams.profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (interestError) throw interestError;
        setAgentInterest(interest || []);
      }

      // Fetch contracts for the user
      const { data: contracts, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .or(`team_id.eq.${profile.id},agent_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (contractError) throw contractError;

      setMessages(messages || []);
      setContracts(contracts || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(full_name, user_type),
          receiver_profile:profiles!messages_receiver_id_fkey(full_name, user_type)
        `)
        .or(`pitch_id.eq.${pitchId || 'null'},player_id.eq.${playerId || 'null'}`)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('pitch_id', pitchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchAgentInterest = async () => {
    if (!pitchId) return;

    try {
      const { data, error } = await supabase
        .from('agent_interest')
        .select(`
          *,
          agent:agents!agent_interest_agent_id_fkey(
            profile:profiles!agents_profile_id_fkey(full_name, user_type)
          ),
          pitch:transfer_pitches!agent_interest_pitch_id_fkey(
            players!inner(full_name, position),
            teams!inner(team_name),
            asking_price,
            currency
          )
        `)
        .eq('pitch_id', pitchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgentInterest(data || []);
    } catch (error) {
      console.error('Error fetching agent interest:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile?.id) return;

    try {
      const messageData = {
        sender_id: profile.id,
        receiver_id: receiverId || '',
        pitch_id: pitchId || null,
        player_id: playerId || null,
        content: newMessage.trim(),
        message_type: 'general',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
      
      toast({
        title: "Message sent!",
        description: "Your message has been delivered.",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const updateInterestStatus = async (interestId: string, newStatus: 'interested' | 'requested' | 'negotiating') => {
    try {
      const { error } = await supabase
        .from('agent_interest')
        .update({ status: newStatus })
        .eq('id', interestId);

      if (error) throw error;

      fetchAgentInterest();
      toast({
        title: "Status updated!",
        description: `Interest status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating interest status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.receiver_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInterest = agentInterest.filter(interest =>
    interest.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interest.pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interest.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Communication Hub
          </CardTitle>
          <p className="text-gray-400">
            {pitchId ? 'Communicate about this specific pitch' : 'Manage all your communications and agent interest'}
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 border-0">
              <TabsTrigger
                value="messages"
                className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
              >
                <MessageCircle className="w-4 h-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger
                value="interest"
                className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
              >
                <Heart className="w-4 h-4" />
                Agent Interest
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4" />
                Contracts
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="mt-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white"
                />
              </div>

              {/* Send Message */}
              {pitchId && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="border-gray-600 bg-gray-800 text-white min-h-[100px]"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-rosegold hover:bg-rosegold/90 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              )}

              {/* Messages List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No messages found</p>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender_id === profile?.id
                          ? 'bg-blue-600/20 border border-blue-600/30 ml-8'
                          : 'bg-gray-700/50 border border-gray-600/30 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {message.sender_profile.full_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-200">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Agent Interest Tab */}
            <TabsContent value="interest" className="mt-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search agent interest..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredInterest.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No agent interest found</p>
                ) : (
                  filteredInterest.map((interest) => (
                    <Card key={interest.id} className="border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white">
                              Agent #{interest.agent_id.slice(0, 8)}
                            </h4>
                            <p className="text-sm text-gray-400">
                              Interested in {interest.pitch.players.full_name} ({interest.pitch.players.position})
                            </p>
                            <p className="text-xs text-gray-500">
                              {interest.pitch.teams.team_name} • {interest.pitch.asking_price.toLocaleString()} {interest.pitch.currency}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {interest.status}
                          </Badge>
                        </div>
                        
                        {interest.message && (
                          <p className="text-gray-300 text-sm mb-3">{interest.message}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                          </span>
                          
                          {profile?.user_type === 'team' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInterestStatus(interest.id, 'negotiating')}
                                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                              >
                                Start Negotiation
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInterestStatus(interest.id, 'requested')}
                                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                              >
                                Request More Info
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value="contracts" className="mt-6 space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contracts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No contracts found</p>
                ) : (
                  contracts.map((contract) => (
                    <Card key={contract.id} className="border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">Contract #{contract.id.slice(0, 8)}</h4>
                          <Badge variant="outline" className="text-xs">
                            {contract.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Value: {contract.contract_value.toLocaleString()} {contract.currency}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          Stage: {contract.deal_stage}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last activity: {formatDistanceToNow(new Date(contract.last_activity), { addSuffix: true })}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedCommunicationHub;
