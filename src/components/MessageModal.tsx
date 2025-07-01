
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Send,
    Upload,
    Download,
    FileText,
    User,
    Clock,
    CheckCircle,
    Paperclip,
    X,
    MessageSquare
} from 'lucide-react';
import { useMessages, Message } from '@/hooks/useMessages';
import { useToast } from '@/hooks/use-toast';
import { contractService, ContractData } from '@/services/contractService';
import { cn } from '@/lib/utils';

// Extend the Message interface to include isNew property
interface ExtendedMessage extends Message {
    isNew?: boolean;
    isOptimistic?: boolean;
}

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pitchId?: string;
    playerId?: string;
    teamId?: string;
    currentUserId: string;
    playerName?: string;
    teamName?: string;
    // Legacy props for backward compatibility
    receiverId?: string;
    receiverName?: string;
    receiverType?: 'agent' | 'team';
    pitchTitle?: string;
}

export function MessageModal({
    isOpen,
    onClose,
    pitchId,
    playerId,
    teamId,
    currentUserId,
    playerName,
    teamName,
    // Legacy props for backward compatibility
    receiverId: propReceiverId,
    receiverName,
    receiverType,
    pitchTitle
}: MessageModalProps) {
    const [message, setMessage] = useState('');
    const [receiverId, setReceiverId] = useState<string>(propReceiverId || '');
    const [isLoadingReceiver, setIsLoadingReceiver] = useState(false);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showContractOptions, setShowContractOptions] = useState(false);
    const [generatingContract, setGeneratingContract] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();

    // Use legacy props if new props are not provided
    const displayPlayerName = playerName || receiverName || 'Unknown Player';
    const displayTeamName = teamName || (receiverType === 'team' ? receiverName : 'Unknown Team');

    const {
        messages,
        loading,
        sending,
        sendMessage,
        markAsRead,
        getMessageStats
    } = useMessages({
        pitchId,
        currentUserId,
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when modal opens
    useEffect(() => {
        if (isOpen && messages.length > 0) {
            const unreadMessages = messages
                .filter(msg => msg.receiver_id === currentUserId && msg.status !== 'read')
                .map(msg => msg.id);

            if (unreadMessages.length > 0) {
                markAsRead(unreadMessages);
            }
        }
    }, [isOpen, messages, currentUserId, markAsRead]);

    // Fetch receiver ID when modal opens
    useEffect(() => {
        if (isOpen && pitchId && !receiverId) {
            fetchReceiverId();
        }
    }, [isOpen, pitchId, receiverId]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const fetchReceiverId = async () => {
        if (!pitchId) return;

        setIsLoadingReceiver(true);
        try {
            // This should be handled by the parent component
            // For now, we'll use the provided receiverId
            if (propReceiverId) {
                setReceiverId(propReceiverId);
            }
        } catch (error) {
            console.error('Error in fetchReceiverId:', error);
        } finally {
            setIsLoadingReceiver(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !receiverId) return;

        try {
            await sendMessage(message, receiverId, pitchId);
            setMessage('');

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            toast({
                title: "Invalid File Type",
                description: "Please upload a PDF or image file",
                variant: "destructive"
            });
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Please upload a file smaller than 5MB",
                variant: "destructive"
            });
            return;
        }

        setContractFile(file);
    };

    const handleContractUpload = async () => {
        if (!contractFile || !receiverId) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const contractUrl = await contractService.uploadContract(contractFile, (progress) => {
                setUploadProgress(progress.percentage);
            });

            // Send message with contract
            await sendMessage(
                `Contract uploaded: ${contractFile.name}`,
                receiverId,
                pitchId
            );

            setContractFile(null);
            setUploadProgress(0);
            setShowContractOptions(false);

            toast({
                title: "Contract Uploaded",
                description: "Contract has been uploaded and sent successfully",
            });
        } catch (error) {
            console.error('Error uploading contract:', error);
            toast({
                title: "Upload Failed",
                description: "Failed to upload contract",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!playerId || !receiverId) {
            toast({
                title: "Missing Information",
                description: "Player and receiver information required for contract generation",
                variant: "destructive"
            });
            return;
        }

        setGeneratingContract(true);

        try {
            // Create contract data object matching the ContractData interface
            const contractData: ContractData = {
                pitchId: pitchId || '',
                playerName: displayPlayerName,
                teamName: displayTeamName,
                transferType: 'permanent', // Default transfer type
                currency: 'USD',
                contractDetails: {
                    duration: '2 years',
                    salary: 50000,
                    signOnBonus: 10000,
                    performanceBonus: 5000,
                    relocationSupport: 3000
                }
            };

            const contractHTML = await contractService.generateContract(contractData);

            await sendMessage(
                "Contract generated and attached",
                receiverId,
                pitchId
            );

            setShowContractOptions(false);
            toast({
                title: "Contract Generated",
                description: "Contract has been generated and sent successfully",
            });
        } catch (error) {
            console.error('Error generating contract:', error);
            toast({
                title: "Generation Failed",
                description: "Failed to generate contract. Please try again.",
                variant: "destructive"
            });
        } finally {
            setGeneratingContract(false);
        }
    };

    const handleDownloadContract = async (contractUrl: string, fileName: string) => {
        try {
            await contractService.downloadContract(contractUrl, fileName);
            toast({
                title: "Download Started",
                description: "Contract download has started",
            });
        } catch (error) {
            console.error('Error downloading contract:', error);
            toast({
                title: "Download Failed",
                description: "Failed to download contract",
                variant: "destructive"
            });
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const messageStats = getMessageStats();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-gray-900">
                                    Transfer Discussion
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-600">
                                    {displayPlayerName} • {displayTeamName}
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                                {messageStats.total} messages
                            </Badge>
                            {messageStats.unread > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {messageStats.unread} new
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium">No messages yet</p>
                                <p className="text-sm">Start the conversation about this transfer</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-3 transition-all duration-300",
                                            msg.sender_id === currentUserId ? "justify-end" : "justify-start",
                                            (msg as ExtendedMessage).isNew && "animate-pulse bg-blue-50 rounded-lg p-2"
                                        )}
                                    >
                                        {msg.sender_id !== currentUserId && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="text-xs">
                                                    {msg.sender_profile?.user_type === 'agent' ? 'A' : 'T'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div className={cn(
                                            "max-w-[70%] space-y-2",
                                            msg.sender_id === currentUserId ? "items-end" : "items-start"
                                        )}>
                                            <div className={cn(
                                                "rounded-2xl px-4 py-3 shadow-sm",
                                                msg.sender_id === currentUserId
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-100 text-gray-900"
                                            )}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                                                {/* Contract attachment */}
                                                {msg.contract_file_url && (
                                                    <div className="mt-3 p-3 bg-white/10 rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="h-4 w-4" />
                                                            <span className="text-xs font-medium">Contract Attached</span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="mt-2 h-6 text-xs"
                                                            onClick={() => handleDownloadContract(msg.contract_file_url!, 'contract.pdf')}
                                                        >
                                                            <Download className="h-3 w-3 mr-1" />
                                                            Download
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>{formatTime(msg.created_at)}</span>
                                                {msg.sender_id === currentUserId && (
                                                    <>
                                                        {msg.status === 'read' ? (
                                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                                        ) : msg.status === 'delivered' ? (
                                                            <CheckCircle className="h-3 w-3 text-blue-500" />
                                                        ) : (
                                                            <Clock className="h-3 w-3 text-gray-400" />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {msg.sender_id === currentUserId && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="text-xs bg-blue-600 text-white">
                                                    Me
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="border-t bg-white p-4">
                        {/* Contract Options */}
                        {showContractOptions && (
                            <Card className="mb-4 border-blue-200 bg-blue-50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-blue-900">
                                        Contract Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => document.getElementById('contract-upload')?.click()}
                                            disabled={isUploading}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Contract
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleGenerateContract}
                                            disabled={generatingContract || !playerId}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            {generatingContract ? 'Generating...' : 'Generate Contract'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowContractOptions(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {contractFile && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                                            <span className="text-sm text-gray-600">{contractFile.name}</span>
                                            <Button
                                                size="sm"
                                                onClick={handleContractUpload}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? `Uploading ${uploadProgress}%` : 'Send'}
                                            </Button>
                                        </div>
                                    )}

                                    {isUploading && (
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Message Input */}
                        <div className="flex items-end space-x-3">
                            <div className="flex-1">
                                <Textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="min-h-[60px] max-h-32 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={sending || isLoadingReceiver}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowContractOptions(!showContractOptions)}
                                    disabled={sending}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>

                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim() || sending || isLoadingReceiver}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {sending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                            id="contract-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default MessageModal;
