
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Paperclip, FileText, Upload } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { MessageBubble } from './MessageBubble';
import { ContractGenerationModal } from './ContractGenerationModal';
import { contractService } from '@/services/contractService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment_urls?: string[];
  file_name?: string;
  file_type?: string;
  file_size?: number;
  contract_file_url?: string;
  sender_profile?: {
    full_name: string;
    user_type: string;
  };
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pitchId?: string;
  playerId?: string;
  teamId?: string;
  receiverId?: string;
  receiverName?: string;
  receiverType?: string;
  pitchTitle?: string;
  currentUserId: string;
  playerName: string;
  teamName?: string;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  pitchId,
  playerId,
  teamId,
  receiverId,
  currentUserId,
  playerName,
  teamName
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<{url: string, name: string, size: number, type: string}[]>([]);
  const [showContractGen, setShowContractGen] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine receiver ID based on user type and available IDs
  const getReceiverId = () => {
    if (receiverId) return receiverId;
    if (profile?.user_type === 'agent') {
      return teamId || '';
    } else {
      return playerId || '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, pitchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!pitchId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(full_name, user_type)
        `)
        .eq('pitch_id', pitchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        attachment_urls: msg.attachment_urls ? 
          (Array.isArray(msg.attachment_urls) ? 
            msg.attachment_urls.map(url => String(url)) : 
            [String(msg.attachment_urls)]) : 
          []
      }));

      setMessages(transformedMessages);

      // Mark messages as read
      const unreadMessages = transformedMessages.filter(msg => 
        msg.receiver_id === profile?.id && msg.status !== 'read'
      );

      if (unreadMessages.length > 0) {
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

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!profile) return;

    const receiverId = getReceiverId();
    if (!receiverId) {
      toast({
        title: "Error",
        description: "Unable to determine message recipient",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const messageData = {
        content: newMessage.trim() || 'Attachment',
        sender_id: profile.id,
        receiver_id: receiverId,
        pitch_id: pitchId,
        player_id: playerId,
        attachment_urls: attachments.length > 0 ? attachments.map(att => att.url) : null,
        file_name: attachments.length > 0 ? attachments[0].name : null,
        file_size: attachments.length > 0 ? attachments[0].size : null,
        file_type: attachments.length > 0 ? attachments[0].type : null,
        status: 'sent' as const
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(full_name, user_type)
        `)
        .single();

      if (error) throw error;

      const transformedMessage: Message = {
        ...data,
        attachment_urls: data.attachment_urls ? 
          (Array.isArray(data.attachment_urls) ? 
            data.attachment_urls.map(url => String(url)) : 
            [String(data.attachment_urls)]) : 
          []
      };

      setMessages(prev => [...prev, transformedMessage]);
      setNewMessage('');
      setAttachments([]);
      setShowAttachments(false);

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
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = (fileUrl: string, fileName: string, fileSize: number, fileType: string) => {
    setAttachments(prev => [...prev, { url: fileUrl, name: fileName, size: fileSize, type: fileType }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleContractGenerated = async (contractHtml: string) => {
    console.log('handleContractGenerated called with HTML length:', contractHtml.length);
    
    try {
      console.log('Step 1: Starting PDF conversion...');
      
      // Create a temporary div to render the HTML with proper styling
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contractHtml;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.padding = '20px';
      document.body.appendChild(tempDiv);
      
      console.log('Step 2: Temporary div created and added to DOM');
      
      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Step 3: Starting canvas conversion...');
      
      try {
        // Convert to canvas with better settings
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800,
          height: tempDiv.scrollHeight,
          logging: false
        });
        
        console.log('Step 4: Canvas conversion successful, canvas size:', canvas.width, 'x', canvas.height);
        
        // Remove temporary div
        document.body.removeChild(tempDiv);
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        console.log('Step 5: PDF created successfully');
        
        // Convert PDF to blob
        const pdfBlob = pdf.output('blob');
        const timestamp = Date.now();
        const fileName = `${playerName}_Contract_${timestamp}.pdf`;
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        console.log('Step 6: File created, size:', file.size, 'bytes');
        
        // Upload contract to contracts bucket (not message-attachments)
        console.log('Step 7: Starting contract upload to contracts bucket...');
        let contractUrl: string | null = null;
        
        try {
          const filePath = `contracts/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('contracts')
            .upload(filePath, file, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('contracts')
            .getPublicUrl(filePath);

          contractUrl = urlData.publicUrl;
          console.log('Step 8: Contract uploaded successfully, URL:', contractUrl);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          contractUrl = null;
          
          toast({
            title: "Upload Failed",
            description: "Failed to upload contract. Please try again or contact support.",
            variant: "destructive",
            duration: 5000,
          });
          
          return;
        }
        
        // Send contract message
        console.log('Step 9: Preparing to send message...');
        const receiverId = getReceiverId();
        if (!receiverId || !profile) {
          console.error('Step 9 ERROR: Missing receiverId or profile');
          toast({
            title: "Error",
            description: "Unable to determine message recipient",
            variant: "destructive"
          });
          return;
        }

        console.log('Step 10: Creating contract message...');
        const contractMessage = {
          content: `📄 Contract generated for ${playerName}`,
          sender_id: profile.id,
          receiver_id: receiverId,
          pitch_id: pitchId,
          player_id: playerId,
          contract_file_url: contractUrl,
          status: 'sent' as const
        };

        console.log('Step 11: Inserting message into database...');
        const { data, error } = await supabase
          .from('messages')
          .insert(contractMessage)
          .select('*')
          .single();

        if (error) {
          console.error('Step 11 ERROR: Database insert failed:', error);
          throw error;
        }

        console.log('Step 12: Message inserted successfully:', data);

        const transformedMessage: Message = {
          ...data,
          attachment_urls: [],
          sender_profile: {
            full_name: profile.full_name || 'You',
            user_type: profile.user_type || 'user'
          }
        };

        setMessages(prev => [...prev, transformedMessage]);
        setShowContractGen(false);

        console.log('Step 13: Contract sent successfully!');
        toast({
          title: "Contract Sent",
          description: "Contract has been generated and sent successfully",
        });
      } catch (canvasError) {
        console.error('Canvas conversion failed:', canvasError);
        throw new Error(`PDF generation failed: ${canvasError.message}`);
      }
    } catch (error) {
      console.error('Error in handleContractGenerated:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send contract",
        variant: "destructive"
      });
    }
  };

  const handleSignedContractUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Handle signed contract upload
    handleFileUploaded(URL.createObjectURL(file), file.name, file.size, file.type);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 border-gray-700 text-white flex flex-col">
          <DialogHeader className="border-b border-gray-700 pb-4">
            <DialogTitle className="flex items-center justify-between">
              <span>Message about {playerName}</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowContractGen(true)}
                  size="sm"
                  className="bg-rosegold hover:bg-rosegold/90"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Contract
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleSignedContractUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="outline"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Signed
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isFromMe={message.sender_id === profile?.id}
                    senderName={message.sender_profile?.full_name}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="border-t border-gray-700 p-3">
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm truncate max-w-32">{attachment.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="resize-none bg-gray-800 border-gray-600"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowAttachments(!showAttachments)}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-700"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={loading || (!newMessage.trim() && attachments.length === 0)}
                  size="sm"
                  className="bg-rosegold hover:bg-rosegold/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* File Upload Section */}
            {showAttachments && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <div className="space-y-3">
                  <div className="text-sm text-gray-300 mb-2">Upload Files</div>
                  <FileUpload onFileUploaded={handleFileUploaded} />
                  
                  {/* Quick Upload Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-600">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={handleSignedContractUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      variant="outline"
                      className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Generation Modal */}
      <ContractGenerationModal
        isOpen={showContractGen}
        onClose={() => setShowContractGen(false)}
        pitchId={pitchId}
        playerName={playerName}
        teamName={teamName || 'Team'}
        onContractGenerated={handleContractGenerated}
      />
    </>
  );
};

export default MessageModal;
