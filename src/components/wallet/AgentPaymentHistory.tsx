import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingDown,
  Download,
  Eye,
  RefreshCw,
  Building,
  User,
  DollarSign
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  contractId: string;
  teamName: string;
  playerName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'installment_active';
  paymentType: 'full' | 'installment';
  date: string;
  installmentInfo?: {
    current: number;
    total: number;
    nextPaymentDate?: string;
    remainingAmount: number;
  };
  paymentMethod: string;
  transactionId?: string;
}

interface AgentPaymentHistoryProps {
  agentId: string;
  onClose?: () => void;
}

const AgentPaymentHistory: React.FC<AgentPaymentHistoryProps> = ({ agentId, onClose }) => {
  const [paymentData, setPaymentData] = useState({
    totalSpent: 0,
    activeInstallments: 0,
    completedTransfers: 0,
    pendingPayments: 0,
    currency: 'USD'
  });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
    loadPayments();
  }, [agentId]);

  const loadPaymentData = async () => {
    // Mock data - replace with actual API call
    setPaymentData({
      totalSpent: 275000,
      activeInstallments: 2,
      completedTransfers: 5,
      pendingPayments: 1,
      currency: 'USD'
    });
  };

  const loadPayments = async () => {
    // Mock data - replace with actual API call
    const mockPayments: PaymentRecord[] = [
      {
        id: '1',
        contractId: 'contract-1',
        teamName: 'Manchester United',
        playerName: 'Marcus Johnson',
        amount: 75000,
        currency: 'USD',
        status: 'installment_active',
        paymentType: 'installment',
        date: '2025-01-15T10:30:00Z',
        installmentInfo: {
          current: 2,
          total: 3,
          nextPaymentDate: '2025-02-15T00:00:00Z',
          remainingAmount: 25000
        },
        paymentMethod: 'Credit Card',
        transactionId: 'TXN-001'
      },
      {
        id: '2',
        contractId: 'contract-2',
        teamName: 'Liverpool FC',
        playerName: 'David Rodriguez',
        amount: 50000,
        currency: 'USD',
        status: 'completed',
        paymentType: 'full',
        date: '2025-01-10T14:20:00Z',
        paymentMethod: 'Bank Transfer',
        transactionId: 'TXN-002'
      },
      {
        id: '3',
        contractId: 'contract-3',
        teamName: 'Arsenal FC',
        playerName: 'Alex Thompson',
        amount: 100000,
        currency: 'USD',
        status: 'installment_active',
        paymentType: 'installment',
        date: '2025-01-08T09:15:00Z',
        installmentInfo: {
          current: 1,
          total: 6,
          nextPaymentDate: '2025-02-08T00:00:00Z',
          remainingAmount: 83333
        },
        paymentMethod: 'Credit Card',
        transactionId: 'TXN-003'
      },
      {
        id: '4',
        contractId: 'contract-4',
        teamName: 'Chelsea FC',
        playerName: 'Roberto Silva',
        amount: 30000,
        currency: 'USD',
        status: 'pending',
        paymentType: 'full',
        date: '2025-01-12T16:45:00Z',
        paymentMethod: 'Credit Card',
        transactionId: 'TXN-004'
      },
      {
        id: '5',
        contractId: 'contract-5',
        teamName: 'Tottenham',
        playerName: 'James Wilson',
        amount: 20000,
        currency: 'USD',
        status: 'failed',
        paymentType: 'full',
        date: '2025-01-05T11:30:00Z',
        paymentMethod: 'Bank Transfer',
        transactionId: 'TXN-005'
      }
    ];

    setPayments(mockPayments);
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

  const retryPayment = (paymentId: string) => {
    console.log('Retrying payment:', paymentId);
    // Implement retry logic
  };

  const exportPayments = () => {
    console.log('Exporting payment history...');
    // Implement export functionality
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10  rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Payment History</h1>
            <p className="text-gray-400">Track all your transfer payments and installments</p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br  border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-gray-100">
                  {paymentData.currency} {paymentData.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br  border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed Transfers</p>
                <p className="text-2xl font-bold text-gray-100">
                  {paymentData.completedTransfers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br  border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Installments</p>
                <p className="text-2xl font-bold text-gray-100">
                  {paymentData.activeInstallments}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br  border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-100">
                  {paymentData.pendingPayments}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className='border-0'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-100">Payment Records</CardTitle>
            <Button variant="outline" size="sm" onClick={exportPayments}>
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Payments</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="installments">Installments</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <Card key={payment.id} className="border-0  bg-[#11111195]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Building className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-100">{payment.teamName}</p>
                              <p className="text-sm text-gray-300">Player: {payment.playerName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              {payment.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="text-right">
                              <p className="font-bold text-gray-100">
                                {payment.currency} {payment.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">{payment.paymentType}</p>
                            </div>
                          </div>
                        </div>

                        {/* Installment Progress */}
                        {payment.installmentInfo && (
                          <div className="mb-3 p-3 bg-[#00000033] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-100">
                                Installment Progress
                              </span>
                              <span className="text-sm text-gray-100">
                                {payment.installmentInfo.current}/{payment.installmentInfo.total} paid
                              </span>
                            </div>
                            <Progress
                              value={(payment.installmentInfo.current / payment.installmentInfo.total) * 100}
                              className="h-2 mb-2"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>
                                Remaining: {payment.currency} {payment.installmentInfo.remainingAmount.toLocaleString()}
                              </span>
                              {payment.installmentInfo.nextPaymentDate && (
                                <span>
                                  Next: {new Date(payment.installmentInfo.nextPaymentDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(payment.date).toLocaleDateString()}
                            </div>
                            <span>Method: {payment.paymentMethod}</span>
                            {payment.transactionId && (
                              <span>ID: {payment.transactionId}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            {payment.status === 'failed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => retryPayment(payment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Other tab contents similar to above but filtered */}
            <TabsContent value="completed" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {payments.filter(p => p.status === 'completed').map((payment) => (
                    <div key={payment.id} className="p-4  bg-[#11111195]  border-0 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-100">{payment.teamName} - {payment.playerName}</p>
                          <p className="text-sm text-gray-400">
                            Completed on {new Date(payment.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-bold text-green-700">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="installments" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {payments.filter(p => p.status === 'installment_active').map((payment) => (
                    <div key={payment.id} className="p-4  bg-[#11111195] border-0 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-100">{payment.teamName} - {payment.playerName}</p>
                          <p className="text-sm text-gray-400">
                            {payment.installmentInfo?.current}/{payment.installmentInfo?.total} payments made
                          </p>
                        </div>
                        <p className="font-bold text-blue-700">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </p>
                      </div>
                      {payment.installmentInfo && (
                        <Progress
                          value={(payment.installmentInfo.current / payment.installmentInfo.total) * 100}
                          className="h-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {payments.filter(p => p.status === 'pending').map((payment) => (
                    <div key={payment.id} className="p-4  bg-[#11111195] border-0 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-100">{payment.teamName} - {payment.playerName}</p>
                          <p className="text-sm text-gray-400">Payment processing...</p>
                        </div>
                        <p className="font-bold text-yellow-700">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="failed" className="mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {payments.filter(p => p.status === 'failed').map((payment) => (
                    <div key={payment.id} className="p-4  bg-[#11111195] border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-100">{payment.teamName} - {payment.playerName}</p>
                          <p className="text-sm text-gray-400">Payment failed - retry required</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-red-700">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryPayment(payment.id)}
                            className="border-red-300 text-red-600 "
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </div>
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

export default AgentPaymentHistory;
