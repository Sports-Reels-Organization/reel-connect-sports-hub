import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Search, Filter, Users, Clock, FileText, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageModal } from '@/components/MessageModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  pitch_id?: string;
  player_id?: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  subject?: string;
  message_type?: string;
  contract_file_url?: string;
  sender_profile?: {
    full_name: string;
    user_type: string;
  };
  receiver_profile?: {
    full_name: string;
    user_type: string;
  };
  player?: {
    full_name: string;
  };
  pitch?: {
    description: string;
  };
}

interface MessageThread {
  id: string;
  participant: {
    id: string;
    name: string;
    type: string;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

const Messages = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [profile?.id]);

  const fetchMessages = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      console.log('Fetching messages for profile:', profile.id);

      // Fetch messages where user is sender or receiver - simplified query to avoid relationship conflicts
      const { data: messages, error } = await supabase
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
          ),
          player:players(
            full_name
          )
        `)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
        return;
      }

      console.log('Fetched messages:', messages);

      // Transform messages to ensure proper typing
      const transformedMessages: Message[] = (messages || []).map(msg => {
        return {
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          pitch_id: msg.pitch_id,
          player_id: msg.player_id,
          created_at: msg.created_at,
          status: msg.status || 'sent',
          subject: msg.subject,
          message_type: msg.message_type,
          contract_file_url: msg.contract_file_url,
          sender_profile: msg.sender_profile,
          receiver_profile: msg.receiver_profile,
          player: msg.player,
          // Remove pitch data for now to avoid relationship conflicts
          pitch: undefined
        };
      });

      // Group messages by conversation (sender/receiver pairs)
      const threads = groupMessagesByThread(transformedMessages, profile.id);
      setMessageThreads(threads);

      // Count unread messages
      const unread = transformedMessages.filter(
        msg => msg.receiver_id === profile.id && msg.status !== 'read'
      ).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const groupMessagesByThread = (messages: Message[], currentUserId: string): MessageThread[] => {
    const threadMap = new Map<string, MessageThread>();

    messages.forEach(message => {
      // Determine the other participant
      const isFromCurrentUser = message.sender_id === currentUserId;
      const otherParticipantId = isFromCurrentUser ? message.receiver_id : message.sender_id;
      const otherParticipant = isFromCurrentUser ? message.receiver_profile : message.sender_profile;

      // Create a unique thread key
      const threadKey = [currentUserId, otherParticipantId].sort().join('-');

      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, {
          id: threadKey,
          participant: {
            id: otherParticipantId,
            name: otherParticipant?.full_name || 'Unknown User',
            type: otherParticipant?.user_type || 'unknown'
          },
          lastMessage: message,
          unreadCount: 0,
          messages: []
        });
      }

      const thread = threadMap.get(threadKey)!;
      thread.messages.push(message);

      // Update last message if this one is newer
      if (new Date(message.created_at) > new Date(thread.lastMessage.created_at)) {
        thread.lastMessage = message;
      }

      // Count unread messages
      if (message.receiver_id === currentUserId && message.status !== 'read') {
        thread.unreadCount++;
      }
    });

    // Sort threads by last message time and sort messages within each thread
    return Array.from(threadMap.values())
      .map(thread => ({
        ...thread,
        messages: thread.messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }))
      .sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );
  };

  const setupRealtimeSubscription = () => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('New message received:', payload.new);
          fetchMessages(); // Refresh messages

          toast({
            title: "New Message",
            description: "You have received a new message",
            duration: 3000,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .in('id', messageIds)
        .eq('receiver_id', profile?.id);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const handleThreadSelect = async (thread: MessageThread) => {
    setSelectedThread(thread);

    // Mark messages as read
    const unreadMessageIds = thread.messages
      .filter(msg => msg.receiver_id === profile?.id && msg.status !== 'read')
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      await markAsRead(unreadMessageIds);
      
      // Update local state
      setMessageThreads(prev => 
        prev.map(t => 
          t.id === thread.id 
            ? { ...t, unreadCount: 0, messages: t.messages.map(m => ({ ...m, status: 'read' as const })) }
            : t
        )
      );
      
      setUnreadCount(prev => prev - unreadMessageIds.length);
    }
  };

  const handleSendMessage = async (content: string, receiverId: string, pitchId?: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content,
          sender_id: profile.id,
          receiver_id: receiverId,
          pitch_id: pitchId,
          status: 'sent'
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      // Refresh messages
      await fetchMessages();

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredThreads = messageThreads.filter(thread => {
    const matchesSearch = thread.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && thread.unreadCount > 0) ||
                         (filterType === 'agents' && thread.participant.type === 'agent') ||
                         (filterType === 'teams' && thread.participant.type === 'team');
    
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="flex h-screen bg-background">
        {/* Messages Sidebar */}
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-6 h-6 text-rosegold" />
              <h1 className="text-xl font-polysans font-bold text-white">Messages</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>

            {/* Filters */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="agents">From Agents</SelectItem>
                <SelectItem value="teams">From Teams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-polysans font-semibold text-white mb-2">
                  No Messages Found
                </h3>
                <p className="text-gray-400 font-poppins">
                  {searchTerm || filterType !== 'all' 
                    ? "Try adjusting your search or filters"
                    : "Start a conversation by messaging other users about transfer opportunities"
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-4 cursor-pointer hover:bg-gray-800 transition-colors ${
                      selectedThread?.id === thread.id ? 'bg-gray-800 border-r-2 border-rosegold' : ''
                    }`}
                    onClick={() => handleThreadSelect(thread)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gray-700 text-white">
                          {thread.participant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-poppins font-medium text-white truncate">
                            {thread.participant.name}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              thread.participant.type === 'agent' 
                                ? "border-blue-400 text-blue-400" 
                                : "border-green-400 text-green-400"
                            )}
                          >
                            {thread.participant.type}
                          </Badge>
                          {thread.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-400 truncate font-poppins">
                          {thread.lastMessage.content}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatDate(thread.lastMessage.created_at)}
                          </span>
                          {thread.lastMessage.contract_file_url && (
                            <FileText className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Detail */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-900">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gray-700 text-white">
                      {selectedThread.participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-polysans font-bold text-white">
                      {selectedThread.participant.name}
                    </h2>
                    <p className="text-sm text-gray-400 capitalize">
                      {selectedThread.participant.type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedThread.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === profile?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === profile?.id
                            ? 'bg-rosegold text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p className="font-poppins">{message.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">
                            {formatDate(message.created_at)}
                          </span>
                          {message.contract_file_url && (
                            <FileText className="w-3 h-3 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim()) {
                          handleSendMessage(target.value, selectedThread.participant.id);
                          target.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        handleSendMessage(input.value, selectedThread.participant.id);
                        input.value = '';
                      }
                    }}
                    className="bg-rosegold hover:bg-rosegold/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                  Select a Conversation
                </h3>
                <p className="text-gray-400 font-poppins">
                  Choose a message thread to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
