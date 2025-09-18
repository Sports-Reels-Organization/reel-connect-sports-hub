import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Building
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'installment_active';
  date: string;
  agent_name?: string;
  player_name?: string;
  installment_info?: {
    current: number;
    total: number;
  };
}

interface TeamWalletProps {
  teamId: string;
  onClose?: () => void;
}

const TeamWallet: React.FC<TeamWalletProps> = ({ teamId, onClose }) => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    pending: 0,
    reserved: 0,
    currency: 'USD'
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
    loadTransactions();
  }, [teamId]);

  const loadWalletData = async () => {
    // Mock data - replace with actual API call
    setWalletData({
      balance: 145000,
      pending: 25000,
      reserved: 5000,
      currency: 'USD'
    });
  };

  const loadTransactions = async () => {
    // Mock data - replace with actual API call
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'incoming',
        amount: 50000,
        currency: 'USD',
        description: 'Transfer payment from Agent John Smith',
        status: 'completed',
        date: '2025-01-15T10:30:00Z',
        agent_name: 'John Smith',
        player_name: 'Marcus Johnson'
      },
      {
        id: '2',
        type: 'incoming',
        amount: 25000,
        currency: 'USD',
        description: 'Installment payment (2/3) from Agent Maria Garcia',
        status: 'installment_active',
        date: '2025-01-14T14:20:00Z',
        agent_name: 'Maria Garcia',
        player_name: 'David Rodriguez',
        installment_info: { current: 2, total: 3 }
      },
      {
        id: '3',
        type: 'incoming',
        amount: 30000,
        currency: 'USD',
        description: 'Transfer payment from Agent Chen Wei',
        status: 'pending',
        date: '2025-01-13T09:15:00Z',
        agent_name: 'Chen Wei',
        player_name: 'Alex Thompson'
      },
      {
        id: '4',
        type: 'outgoing',
        amount: 2500,
        currency: 'USD',
        description: 'Platform service fee',
        status: 'completed',
        date: '2025-01-12T16:45:00Z'
      },
      {
        id: '5',
        type: 'incoming',
        amount: 75000,
        currency: 'USD',
        description: 'Transfer payment from Agent Sarah Wilson',
        status: 'failed',
        date: '2025-01-11T11:30:00Z',
        agent_name: 'Sarah Wilson',
        player_name: 'Roberto Silva'
      }
    ];

    setTransactions(mockTransactions);
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'installment_active':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'installment_active':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const exportTransactions = () => {
    // Mock export functionality
    console.log('Exporting transactions...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Team Wallet</h1>
            <p className="text-gray-400">Financial overview and transaction history</p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-900 to-emerald-800 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 font-medium">Available Balance</p>
                <p className="text-2xl font-bold text-gray-100">
                  {walletData.currency} {walletData.balance.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300 font-medium">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-100">
                  {walletData.currency} {walletData.pending.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-700 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900 to-indigo-800 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300 font-medium">Reserved Funds</p>
                <p className="text-2xl font-bold text-gray-100">
                  {walletData.currency} {walletData.reserved.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-pink-800 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-gray-100">
                  {walletData.currency} {(walletData.balance + walletData.pending + walletData.reserved).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className='border-0'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-100">Transaction History</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportTransactions}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportTransactions}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="incoming">Incoming</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-[#11111195] border-0 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                          {transaction.type === 'incoming' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-100">{transaction.description}</p>
                            <Badge variant="outline" className={getStatusColor(transaction.status)}>
                              {transaction.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>

                            {transaction.agent_name && (
                              <span>Agent: {transaction.agent_name}</span>
                            )}

                            {transaction.player_name && (
                              <span>Player: {transaction.player_name}</span>
                            )}

                            {transaction.installment_info && (
                              <span>
                                Installment {transaction.installment_info.current}/{transaction.installment_info.total}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`font-bold ${transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.type === 'incoming' ? '+' : '-'}{transaction.currency} {transaction.amount.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Similar content for other tabs */}
            <TabsContent value="incoming" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {transactions.filter(t => t.type === 'incoming').map((transaction) => (
                    <div key={transaction.id} className="p-4 bg-[#11111195]  border-0 rounded-lg">
                      <p className="font-medium text-gray-300">{transaction.description}</p>
                      <p className="text-sm text-green-600 mt-1">
                        +{transaction.currency} {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="outgoing" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {transactions.filter(t => t.type === 'outgoing').map((transaction) => (
                    <div key={transaction.id} className="p-4 bg-[#11111195] border-0 rounded-lg">
                      <p className="font-medium text-gray-100">{transaction.description}</p>
                      <p className="text-sm text-red-700 mt-1">
                        -{transaction.currency} {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {transactions.filter(t => t.status === 'pending').map((transaction) => (
                    <div key={transaction.id} className="p-4 bg-[#11111195] border-0 rounded-lg">
                      <p className="font-medium text-gray-100">{transaction.description}</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        {transaction.currency} {transaction.amount.toLocaleString()} - Pending
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamWallet;
