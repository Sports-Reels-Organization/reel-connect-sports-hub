import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Download,
  Send,
  User,
  Calendar,
  DollarSign,
  Building,
  Trophy,
  Star,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ArrowLeft,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { contractManagementService } from '@/services/contractManagementService';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

interface ContractMessage {
  id: string;
  contract_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  related_field?: string;
  created_at: string;
  sender_profile?: {
    full_name: string;
    user_type: string;
  };
}

interface Contract {
  id: string;
  pitch_id: string;
  agent_id: string;
  team_id: string;
  transfer_type: 'permanent' | 'loan';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  current_step: 'draft' | 'review' | 'negotiation' | 'finalization' | 'completed';
  contract_value: number;
  currency: string;
  document_url?: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
  pitch?: {
    id: string;
    transfer_type: string;
    asking_price: number;
    currency: string;
    status: string;
    player?: {
      full_name: string;
      position: string;
      citizenship: string;
    };
  };
  agent?: {
    profile: {
      full_name: string;
      email: string;
    };
  };
  team?: {
    team_name: string;
    country: string;
    logo_url?: string;
  };
}

const ContractNegotiationPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [contractPreview, setContractPreview] = useState<string>('');
  const [showContractPreview, setShowContractPreview] = useState(true);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionDetails, setActionDetails] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    if (contractId) {
      loadContractData();
    }
  }, [contractId]);

  const loadContractData = async () => {
    setLoading(true);
    try {
      // Load contract with related data
      const contractData = await contractManagementService.getContract(contractId!);
      setContract(contractData);

      // Load contract messages
      const messagesData = await contractManagementService.getContractMessages(contractId!);
      setMessages(messagesData);

      // Generate contract preview
      if (contractData) {
        const preview = await contractManagementService.generateContractPreview(contractData);
        setContractPreview(preview);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      toast({
        title: "Error",
        description: "Failed to load contract data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !contract) return;

    try {
      const data = await contractManagementService.addContractMessage(
        contractId!,
        profile?.user_id!,
        newMessage.trim(),
        'discussion'
      );

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
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

  const handleContractAction = async (action: string) => {
    if (!contract) return;

    try {
      const result = await contractManagementService.handleContractAction({
        contractId: contractId!,
        action: action as any,
        details: actionDetails,
        userId: profile?.user_id!
      });

      setContract(prev => prev ? {
        ...prev,
        status: result.newStatus,
        current_step: result.newStep,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null);

      // Reload messages to show the action message
      const messagesData = await contractManagementService.getContractMessages(contractId!);
      setMessages(messagesData);

      toast({
        title: "Success",
        description: `Contract ${action.replace('-', ' ')} successfully`
      });

      setActionModalOpen(false);
      setSelectedAction('');
      setActionDetails('');
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "Failed to update contract",
        variant: "destructive"
      });
    }
  };

  const handlePlayerTransfer = async () => {
    try {
      await contractManagementService.completeTransfer(contractId!, contract.pitch_id);

      toast({
        title: "Transfer Completed",
        description: "Player has been successfully transferred"
      });

      // Navigate back to contracts page
      navigate('/contracts');
    } catch (error) {
      console.error('Error completing transfer:', error);
      toast({
        title: "Error",
        description: "Failed to complete transfer",
        variant: "destructive"
      });
    }
  };

  const uploadContractDocument = async (file: File) => {
    if (!contract) return;

    setUploadingDocument(true);
    try {
      const url = await contractManagementService.uploadContractDocument(contractId!, file);

      setContract(prev => prev ? {
        ...prev,
        document_url: url,
        updated_at: new Date().toISOString()
      } : null);

      toast({
        title: "Document uploaded",
        description: "Contract document has been uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const downloadContract = () => {
    if (contract?.document_url) {
      // Download uploaded document
      window.open(contract.document_url, '_blank');
    } else {
      // Download generated contract
      const blob = new Blob([contractPreview], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'draft': return 'bg-gray-500';
      case 'review': return 'bg-blue-500';
      case 'negotiation': return 'bg-yellow-500';
      case 'finalization': return 'bg-green-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading contract...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
            <p className="text-muted-foreground mb-4">The contract you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/contracts')}>
              Back to Contracts
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/contracts')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Contracts
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Contract Negotiation</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Contract ID: {contractId}</span>
                  <Badge variant="outline" className={getStatusColor(contract.status)}>
                    {contract.status}
                  </Badge>
                  <Badge variant="outline" className={getStepColor(contract.current_step)}>
                    {contract.current_step}
                  </Badge>
                  <span className="capitalize">{contract.transfer_type} Transfer</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContractPreview(!showContractPreview)}
              >
                {showContractPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showContractPreview ? 'Hide' : 'Show'} Contract
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadContract}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Contract Preview */}
          {showContractPreview && (
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contract Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: contractPreview }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Right Panel - Main Content */}
          <div className={showContractPreview ? "lg:col-span-2" : "lg:col-span-3"}>
            <Tabs defaultValue="discussion" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="discussion" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Discussion
                </TabsTrigger>
                <TabsTrigger value="contract" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contract
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussion" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Discussion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96 mb-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.sender_id === profile?.user_id ? 'flex-row-reverse' : ''
                            }`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium ${
                              message.sender_profile?.user_type === 'agent' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              {message.sender_profile?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className={`flex-1 max-w-xs ${
                              message.sender_id === profile?.user_id ? 'text-right' : ''
                            }`}>
                              <div className={`inline-block p-3 rounded-lg ${
                                message.sender_id === profile?.user_id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                <p className="text-sm font-medium mb-1">{message.sender_profile?.full_name || 'Unknown'}</p>
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(message.created_at).toLocaleString()}
                                </p>
                                {message.message_type === 'action' && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {message.related_field}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contract" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Player</Label>
                          <p className="text-sm text-muted-foreground">{contract.pitch?.player?.full_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Position</Label>
                          <p className="text-sm text-muted-foreground">{contract.pitch?.player?.position}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Transfer Type</Label>
                          <p className="text-sm text-muted-foreground capitalize">{contract.transfer_type}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Contract Value</Label>
                          <p className="text-sm text-muted-foreground">{contract.currency} {contract.contract_value?.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {contract.document_url && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">Uploaded Contract Document</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(contract.document_url, '_blank')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Document
                          </Button>
                        </div>
                      )}
                      
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: contractPreview }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Contract Created</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(contract.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Under Review</p>
                          <p className="text-sm text-muted-foreground">
                            Contract is being reviewed by both parties
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">In Negotiation</p>
                          <p className="text-sm text-muted-foreground">
                            Currently in negotiation phase
                          </p>
                        </div>
                      </div>
                      {contract.status === 'approved' && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Approved</p>
                            <p className="text-sm text-muted-foreground">
                              Contract has been approved
                            </p>
                          </div>
                        </div>
                      )}
                      {contract.status === 'completed' && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Transfer Completed</p>
                            <p className="text-sm text-muted-foreground">
                              Player transfer has been completed
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <AlertDialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => {
                          setSelectedAction('approve');
                          setActionModalOpen(true);
                        }}
                      >
                        <ThumbsUp className="h-5 w-5" />
                        <span className="text-sm">Approve</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Contract</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to approve this contract? This will move it to the finalization stage.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleContractAction('approve')}>
                          Approve
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => {
                          setSelectedAction('reject');
                          setActionModalOpen(true);
                        }}
                      >
                        <ThumbsDown className="h-5 w-5" />
                        <span className="text-sm">Reject</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Contract</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject this contract? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleContractAction('reject')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                      >
                        <Edit className="h-5 w-5" />
                        <span className="text-sm">Request Changes</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Changes</DialogTitle>
                        <DialogDescription>
                          Please specify what changes you would like to request for this contract.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="changes">Changes Requested</Label>
                          <Textarea
                            id="changes"
                            placeholder="Describe the changes you would like to request..."
                            value={actionDetails}
                            onChange={(e) => setActionDetails(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={() => handleContractAction('request-changes')}>
                          Submit Request
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => {
                          setSelectedAction('complete');
                          setActionModalOpen(true);
                        }}
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">Complete Transfer</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Complete Transfer</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to complete this transfer? This will mark the player as transferred and remove them from the pitch.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleContractAction('complete')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Complete Transfer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContractNegotiationPage;
