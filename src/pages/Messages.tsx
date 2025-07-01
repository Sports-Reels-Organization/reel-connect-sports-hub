
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, User, Clock, Paperclip, FileText } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { FilePreview } from '@/components/FilePreview';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  pitch_id?: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
  file_name?: string;
  file_size?: number;
  file_type?: string;
  attachment_urls?: string[];
  sender_profile?: {
    full_name: string;
    user_type: string;
  };
  receiver_profile?: {
    full_name: string;
    user_type: string;
  };
}

interface Conversation {
  participant: {
    id: string;
    full_name: string;
    user_type: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

const Messages = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<{url: string, name: string, size: number, type: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchConversations();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(id, full_name, user_type),
          receiver_profile:profiles!messages_receiver_id_fkey(id, full_name, user_type)
        `)
        .or(`sender_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();

      allMessages?.forEach(message => {
        const isFromMe = message.sender_id === profile?.id;
        const partnerId = isFromMe ? message.receiver_id : message.sender_id;
        const partnerProfile = isFromMe ? message.receiver_profile : message.sender_profile;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            participant: {
              id: partnerId,
              full_name: partnerProfile?.full_name || 'Unknown User',
              user_type: partnerProfile?.user_type || 'user'
            },
            lastMessage: message,
            unreadCount: !isFromMe && message.status !== 'read' ? 1 : 0
          });
        } else {
          const existing = conversationMap.get(partnerId)!;
          if (new Date(message.created_at) > new Date(existing.lastMessage.created_at)) {
            existing.lastMessage = message;
          }
          if (!isFromMe && message.status !== 'read') {
            existing.unreadCount++;
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (participantId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(id, full_name, user_type),
          receiver_profile:profiles!messages_receiver_id_fkey(id, full_name, user_type)
        `)
        .or(`and(sender_id.eq.${profile?.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${profile?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(msg => 
        msg.receiver_id === profile?.id && msg.status !== 'read'
      );

      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ status: 'read' })
          .in('id', unreadMessages.map(msg => msg.id));
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!selectedConversation || !profile?.id) return;

    try {
      const messageData = {
        content: newMessage.trim() || 'Attachment',
        sender_id: profile.id,
        receiver_id: selectedConversation,
        attachment_urls: attachments.length > 0 ? attachments.map(att => att.url) : null,
        file_name: attachments.length > 0 ? attachments[0].name : null,
        file_size: attachments.length > 0 ? attachments[0].size : null,
        file_type: attachments.length > 0 ? attachments[0].type : null,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(id, full_name, user_type),
          receiver_profile:profiles!messages_receiver_id_fkey(id, full_name, user_type)
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setAttachments([]);
      fetchConversations(); // Refresh conversations to update last message

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleFileUploaded = (fileUrl: string, fileName: string, fileSize: number, fileType: string) => {
    setAttachments(prev => [...prev, { url: fileUrl, name: fileName, size: fileSize, type: fileType }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-500">Loading messages...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-screen bg-background">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-polysans font-bold text-white">Messages</h2>
          </div>
          
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-500">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.participant.id}
                  onClick={() => setSelectedConversation(conversation.participant.id)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
                    selectedConversation === conversation.participant.id ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rosegold rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{conversation.participant.full_name}</p>
                        <p className="text-sm text-gray-400 truncate max-w-[200px]">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.created_at)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="mt-1">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rosegold rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      {conversations.find(c => c.participant.id === selectedConversation)?.participant.full_name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {conversations.find(c => c.participant.id === selectedConversation)?.participant.user_type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isFromMe = message.sender_id === profile?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            isFromMe
                              ? 'bg-rosegold text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          
                          {/* File attachments */}
                          {message.attachment_urls && message.attachment_urls.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachment_urls.map((url, index) => (
                                <FilePreview
                                  key={index}
                                  fileUrl={url}
                                  fileName={message.file_name || `attachment-${index + 1}`}
                                  fileType={message.file_type || 'application/octet-stream'}
                                  fileSize={message.file_size || 0}
                                />
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">
                              {formatTime(message.created_at)}
                            </p>
                            {isFromMe && (
                              <Badge variant={message.status === 'read' ? 'default' : 'secondary'} className="text-xs">
                                {message.status || 'sent'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {attachments.map((attachment, index) => (
                      <FilePreview
                        key={index}
                        fileUrl={attachment.url}
                        fileName={attachment.name}
                        fileType={attachment.type}
                        fileSize={attachment.size}
                        onRemove={() => removeAttachment(index)}
                        showRemove={true}
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <FileUpload onFileUploaded={handleFileUploaded} />
                    <Button onClick={handleSendMessage} className="bg-rosegold hover:bg-rosegold/90">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
