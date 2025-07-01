import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    FileText,
    Download,
    Eye,
    Plus,
    DollarSign,
    Calendar,
    User,
    Building,
    X
} from 'lucide-react';
import { contractService, ContractData } from '@/services/contractService';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';

const Contracts = () => {
    const { profile } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingContract, setCreatingContract] = useState(false);

    // Contract form state
    const [contractForm, setContractForm] = useState({
        playerName: '',
        playerPosition: '',
        playerNationality: '',
        playerDateOfBirth: '',
        sellingClub: '',
        buyingClub: '',
        transferFee: '',
        currency: 'USD',
        transferType: 'permanent' as 'permanent' | 'loan',
        contractDuration: '',
        loanDuration: '',
        playerSalary: '',
        signOnBonus: '',
        performanceBonus: '',
        agentName: '',
        agentAgency: '',
        transferDate: new Date().toISOString().split('T')[0],
        playerId: '', // Required for database foreign key
        agentId: '' // Required for database foreign key
    });

    useEffect(() => {
        if (profile?.user_id) {
            fetchContracts();
        }
    }, [profile]);

    const handleCreateContract = () => {
        setShowCreateModal(true);
    };

    const fetchContracts = async () => {
        if (!profile?.user_id) return;

        try {
            setLoading(true);
            // For now, we'll use a simple query to get contracts
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .or(`agent_id.eq.${profile.id},team_id.eq.${profile.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching contracts:', error);
                toast({
                    title: t('error'),
                    description: "Failed to fetch contracts",
                    variant: "destructive"
                });
            } else {
                setContracts(data || []);
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
            toast({
                title: t('error'),
                description: "Failed to fetch contracts",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitContract = async () => {
        try {
            setCreatingContract(true);

            // Validate required fields
            if (!contractForm.playerId || !contractForm.agentId || !contractForm.playerName) {
                toast({
                    title: "Validation Error",
                    description: "Please fill in all required fields",
                    variant: "destructive"
                });
                return;
            }

            const contractData: ContractData = {
                pitchId: '', // Will be set if related to a pitch
                playerName: contractForm.playerName,
                teamName: contractForm.buyingClub,
                transferType: contractForm.transferType,
                askingPrice: contractForm.transferFee ? parseFloat(contractForm.transferFee) : undefined,
                currency: contractForm.currency,
                contractDetails: {
                    duration: contractForm.contractDuration,
                    salary: contractForm.playerSalary ? parseFloat(contractForm.playerSalary) : 0,
                    signOnBonus: contractForm.signOnBonus ? parseFloat(contractForm.signOnBonus) : undefined,
                    performanceBonus: contractForm.performanceBonus ? parseFloat(contractForm.performanceBonus) : undefined,
                }
            };

            // Generate contract
            const contractHTML = await contractService.generateContract(contractData);
            if (!contractHTML) {
                toast({
                    title: t('error'),
                    description: "Failed to generate contract",
                    variant: "destructive"
                });
                return;
            }

            // Save contract to database
            const contractId = await contractService.saveContract({
                playerId: contractForm.playerId,
                agentId: contractForm.agentId,
                teamId: profile?.id,
                transferType: contractForm.transferType,
                ...contractData
            });

            if (!contractId) {
                toast({
                    title: t('error'),
                    description: "Failed to save contract",
                    variant: "destructive"
                });
                return;
            }

            toast({
                title: t('success'),
                description: "Contract created successfully!",
            });

            // Reset form and close modal
            setContractForm({
                playerName: '',
                playerPosition: '',
                playerNationality: '',
                playerDateOfBirth: '',
                sellingClub: '',
                buyingClub: '',
                transferFee: '',
                currency: 'USD',
                transferType: 'permanent',
                contractDuration: '',
                loanDuration: '',
                playerSalary: '',
                signOnBonus: '',
                performanceBonus: '',
                agentName: '',
                agentAgency: '',
                transferDate: new Date().toISOString().split('T')[0],
                playerId: '',
                agentId: ''
            });
            setShowCreateModal(false);
            fetchContracts();
        } catch (error) {
            console.error('Error creating contract:', error);
            toast({
                title: t('error'),
                description: "Failed to create contract",
                variant: "destructive"
            });
        } finally {
            setCreatingContract(false);
        }
    };

    const handleDownloadContract = async (contractId: string) => {
        try {
            // For now, we'll use a placeholder URL
            const contractUrl = `https://example.com/contracts/${contractId}.pdf`;
            await contractService.downloadContract(contractUrl, `contract_${contractId}.pdf`);

            toast({
                title: t('success'),
                description: "Contract downloaded successfully",
            });
        } catch (error) {
            console.error('Error downloading contract:', error);
            toast({
                title: t('error'),
                description: "Failed to download contract",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            'draft': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            'sent': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'signed': 'bg-green-500/20 text-green-400 border-green-500/30',
            'completed': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        };

        const color = statusColors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

        return (
            <Badge variant="outline" className={color}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const filteredContracts = contracts.filter(contract => {
        if (activeTab === 'all') return true;
        return contract.status === activeTab;
    });

    if (loading) {
        return (
            <Layout>
                <div className="p-6">
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-32 bg-gray-700 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-[3rem] space-y-6">
                <div className="flex items-center justify-between">
                    <div className='text-start'>
                        <h1 className="text-3xl font-polysans font-bold text-white mb-2">
                            {t('contractManagement')}
                        </h1>
                        <p className="text-gray-400 font-poppins">
                            Manage your transfer contracts and agreements
                        </p>
                    </div>
                    <Button
                        onClick={handleCreateContract}
                        className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('newContract')}
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 bg-card border-0">
                        <TabsTrigger value="all" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                            All ({contracts.length})
                        </TabsTrigger>
                        <TabsTrigger value="draft" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                            Draft
                        </TabsTrigger>
                        <TabsTrigger value="sent" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                            Sent
                        </TabsTrigger>
                        <TabsTrigger value="signed" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                            Signed
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
                            Completed
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="space-y-4">
                        {filteredContracts.length === 0 ? (
                            <Card className="border-gray-700">
                                <CardContent className="p-12 text-center">
                                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                                    <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                                        No Contracts
                                    </h3>
                                    <p className="text-gray-400 font-poppins">
                                        {activeTab === 'all'
                                            ? "You haven't created any contracts yet."
                                            : `No ${activeTab} contracts found.`
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredContracts.map((contract) => (
                                <Card key={contract.id} className="border-gray-700">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-polysans font-semibold text-white">
                                                        Contract #{contract.id.slice(0, 8)}
                                                    </h3>
                                                    {getStatusBadge(contract.status)}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-300 text-sm">
                                                            {contract.contract_type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-300 text-sm">
                                                            {new Date(contract.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <span>Status: {contract.status}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadContract(contract.id)}
                                                    className="border-gray-600 text-gray-400 hover:bg-gray-700"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    {t('download')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-600 text-gray-400 hover:bg-gray-700"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    {t('view')}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>

                {/* Create Contract Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-white font-polysans">{t('newContract')}</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="text-center py-8">
                                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                                    <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                                        {t('contractCreation')}
                                    </h3>
                                    <p className="text-gray-400 font-poppins mb-4">
                                        Contract creation form will be implemented here.
                                    </p>
                                    <Button
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
                                    >
                                        {t('cancel')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Contracts;
