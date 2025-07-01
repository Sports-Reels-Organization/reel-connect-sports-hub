import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  User,
  Building2,
  Send,
  Download,
  Upload,
  FileText,
  Clock,
  Check,
  Reply,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { MessageModal } from '@/components/MessageModal';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  pitch_id?: string;
  player_id?: string;
  subject?: string;
  status?: 'sent' | 'delivered' | 'read';
  is_flagged?: boolean;
  transfer_pitch_id?: string;
  message_thread_id?: string;
  attachment_urls?: any;
  contract_file_url?: string;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    full_name: string;
    user_type: string;
  };
  receiver_profile?: {
    full_name: string;
    user_type: string;
  };
}

const Messages = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyReceiver, setReplyReceiver] = useState<{
    id: string;
    name: string;
    type: 'agent' | 'team';
  } | null>(null);

  // Fetch messages
  useEffect(() => {
    if (profile?.id) {
      fetchMessages();
    }
  }, [profile]);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            full_name,
            user_type
          ),
          receiver_profile:profiles!messages_receiver_id_fkey(
            full_name,
            user_type
          )
        `)
        .or(`sender_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      } else {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
      } else {
        // Update local state
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, status: 'read' } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const handleReply = (message: Message) => {
    const isIncoming = message.sender_id !== profile?.id;
    const receiverId = isIncoming ? message.sender_id : message.receiver_id;
    const receiverProfile = isIncoming ? message.sender_profile : message.receiver_profile;

    setReplyReceiver({
      id: receiverId,
      name: receiverProfile?.full_name || 'Unknown',
      type: receiverProfile?.user_type === 'agent' ? 'agent' : 'team'
    });
    setShowReplyModal(true);
  };

  const handleDownloadContract = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "Contract download has started",
      });
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download contract. The file may have been removed or you may not have permission to access it.",
        variant: "destructive"
      });
    }
  };

  const getInboxMessages = () => messages.filter(msg => msg.receiver_id === profile?.id);
  const getSentMessages = () => messages.filter(msg => msg.sender_id === profile?.id);
  const getUnreadCount = () => getInboxMessages().filter(msg => msg.status !== 'read').length;

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 p-[3rem] bg-background">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rosegold mx-auto mb-4"></div>
            <h3 className="text-xl font-polysans font-semibold text-white mb-2">
              Loading Messages
            </h3>
            <p className="text-gray-400 font-poppins">
              Please wait while we load your messages...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-[3rem] bg-background">
        <div className='text-start'>
          <h1 className="text-3xl text-start font-polysans font-bold text-white mb-2">
            Messages
          </h1>
          <p className="text-rosegold font-poppins">
            Communicate with teams and agents about transfer opportunities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="inbox" className="data-[state=active]:bg-rosegold">
              Inbox {getUnreadCount() > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {getUnreadCount()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-rosegold">
              Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            {getInboxMessages().length === 0 ? (
              <Card className="bg-white/5 border-0">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-rosegold mx-auto mb-4" />
                  <h3 className="text-xl font-polysans text-white mb-2">No Messages</h3>
                  <p className="text-gray-400 font-poppins">
                    You don't have any messages yet. Agents will contact you when they're interested in your players.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getInboxMessages().map((message) => (
                <Card
                  key={message.id}
                  className={`bg-white/5 border-0 cursor-pointer hover:bg-white/10 transition-colors ${message.status !== 'read' ? 'border-l-4 border-l-rosegold' : ''
                    }`}
                  onClick={() => {
                    if (message.status !== 'read') {
                      markAsRead(message.id);
                    }
                    setSelectedMessage(message);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {message.sender_profile?.user_type === 'agent' ? (
                            <User className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Building2 className="h-4 w-4 text-green-400" />
                          )}
                          <span className="font-polysans font-semibold text-white">
                            {message.sender_profile?.full_name || 'Unknown'}
                          </span>
                          {message.status !== 'read' && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                          {message.content}
                        </p>

                        {message.subject && (
                          <div className="text-xs text-gray-400 mb-2">
                            Subject: {message.subject}
                          </div>
                        )}

                        {/* Contract file display - temporarily disabled until database migration
                        {message.contract_file_url && (
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-500">Contract attached</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(message.contract_file_url!, '_blank')}
                              className="h-6 px-2 text-xs"
                            >
                              View
                            </Button>
                          </div>
                        )}
                        */}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatMessageTime(message.created_at)}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Contract download - temporarily disabled until database migration
                            {message.contract_file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadContract(
                                    message.contract_file_url!,
                                    `contract_${message.id}.pdf`
                                  );
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                            */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(message);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {getSentMessages().length === 0 ? (
              <Card className="bg-white/5 border-0">
                <CardContent className="p-12 text-center">
                  <Send className="h-12 w-12 text-rosegold mx-auto mb-4" />
                  <h3 className="text-xl font-polysans text-white mb-2">No Sent Messages</h3>
                  <p className="text-gray-400 font-poppins">
                    You haven't sent any messages yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getSentMessages().map((message) => (
                <Card key={message.id} className="bg-white/5 border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {message.receiver_profile?.user_type === 'agent' ? (
                            <User className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Building2 className="h-4 w-4 text-green-400" />
                          )}
                          <span className="font-polysans font-semibold text-white">
                            To: {message.receiver_profile?.full_name || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-1">
                            {message.status === 'read' ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-400">
                              {message.status === 'read' ? 'Read' : 'Sent'}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                          {message.content}
                        </p>

                        {message.subject && (
                          <div className="text-xs text-gray-400 mb-2">
                            Subject: {message.subject}
                          </div>
                        )}

                        {/* Contract file display - temporarily disabled until database migration
                        {message.contract_file_url && (
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-500">Contract attached</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(message.contract_file_url!, '_blank')}
                              className="h-6 px-2 text-xs"
                            >
                              View
                            </Button>
                          </div>
                        )}
                        */}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatMessageTime(message.created_at)}
                          </div>

                          {/* Contract download - temporarily disabled until database migration
                          {message.contract_file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadContract(
                                message.contract_file_url!,
                                `contract_${message.id}.pdf`
                              )}
                              className="h-6 px-2 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                          */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Reply Modal */}
        {showReplyModal && replyReceiver && (
          <MessageModal
            isOpen={showReplyModal}
            onClose={() => {
              setShowReplyModal(false);
              setReplyReceiver(null);
            }}
            currentUserId={profile?.id || ''}
            receiverId={replyReceiver.id}
            receiverName={replyReceiver.name}
            receiverType={replyReceiver.type}
            pitchTitle={selectedMessage?.subject}
          />
        )}
      </div>
    </Layout>
  );
};

export default Messages;
