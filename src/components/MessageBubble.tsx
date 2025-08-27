
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    contract_file_url?: string;
    message_type?: string;
    is_flagged?: boolean;
  };
  isFromMe: boolean;
  senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFromMe,
  senderName
}) => {
  const handleDownloadContract = () => {
    if (message.contract_file_url) {
      window.open(message.contract_file_url, '_blank');
    }
  };

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isFromMe 
          ? 'bg-rosegold text-white' 
          : 'bg-gray-700 text-white'
      }`}>
        {!isFromMe && senderName && (
          <div className="text-xs text-gray-300 mb-1 font-medium">
            {senderName}
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-sm">{message.content}</p>
          
          {message.contract_file_url && (
            <div className="bg-black/20 rounded p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Contract Attached</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownloadContract}
                  className="h-6 px-2 text-xs hover:bg-white/10"
                >
                  <Download className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          )}
          
          {message.message_type && message.message_type !== 'general' && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-black/20 text-current"
            >
              {message.message_type.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
          
          {message.is_flagged && (
            <div className="flex items-center gap-1 text-red-400">
              <Flag className="w-3 h-3" />
              <span className="text-xs">Content flagged</span>
            </div>
          )}
        </div>
        
        <div className="text-xs opacity-70 mt-2">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
};
