import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  Globe,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  Eye,
  MessageSquare
} from 'lucide-react';
import AgentRequestsExplore from './AgentRequestsExplore';
import ExploreRequests from '@/components/ExploreRequests';

interface AgentExploreHubProps {
  initialSearch?: string;
}

interface TransferPitch {
  id: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  expires_at: string;
  created_at: string;
  description?: string;
  view_count?: number;
  message_count?: number;
  shortlist_count?: number;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    age: number;
  };
  teams: {
    team_name: string;
    country: string;
  };
}

export const AgentExploreHub: React.FC<AgentExploreHubProps> = ({ initialSearch }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [transferPitches, setTransferPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pitches');

  useEffect(() => {
    fetchTransferPitches();
  }, []);

  const fetchTransferPitches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          id,
          asking_price,
          currency,
          transfer_type,
          expires_at,
          created_at,
          description,
          view_count,
          message_count,
          shortlist_count,
          players!inner (
            id,
            full_name,
            position,
            citizenship,
            date_of_birth
          ),
          teams!inner (
            team_name,
            country
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Process data to add age calculation and ensure proper typing
      const processedPitches = (data || []).map(pitch => ({
        id: pitch.id,
        asking_price: pitch.asking_price || 0,
        currency: pitch.currency || 'USD',
        transfer_type: pitch.transfer_type,
        expires_at: pitch.expires_at,
        created_at: pitch.created_at,
        description: pitch.description,
        view_count: pitch.view_count,
        message_count: pitch.message_count,
        shortlist_count: pitch.shortlist_count,
        players: {
          id: pitch.players.id,
          full_name: pitch.players.full_name,
          position: pitch.players.position,
          citizenship: pitch.players.citizenship,
          age: pitch.players.date_of_birth 
            ? new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear()
            : 0
        },
        teams: {
          team_name: pitch.teams.team_name,
          country: pitch.teams.country
        }
      }));

      setTransferPitches(processedPitches);
    } catch (error) {
      console.error('Error fetching transfer pitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTransferPitches();
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          id,
          asking_price,
          currency,
          transfer_type,
          expires_at,
          created_at,
          description,
          view_count,
          message_count,
          shortlist_count,
          players!inner (
            id,
            full_name,
            position,
            citizenship,
            date_of_birth
          ),
          teams!inner (
            team_name,
            country
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .or(`players.full_name.ilike.%${searchQuery}%,players.position.ilike.%${searchQuery}%,teams.team_name.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to add age calculation and ensure proper typing
      const processedPitches = (data || []).map(pitch => ({
        id: pitch.id,
        asking_price: pitch.asking_price || 0,
        currency: pitch.currency || 'USD',
        transfer_type: pitch.transfer_type,
        expires_at: pitch.expires_at,
        created_at: pitch.created_at,
        description: pitch.description,
        view_count: pitch.view_count,
        message_count: pitch.message_count,
        shortlist_count: pitch.shortlist_count,
        players: {
          id: pitch.players.id,
          full_name: pitch.players.full_name,
          position: pitch.players.position,
          citizenship: pitch.players.citizenship,
          age: pitch.players.date_of_birth 
            ? new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear()
            : 0
        },
        teams: {
          team_name: pitch.teams.team_name,
          country: pitch.teams.country
        }
      }));

      setTransferPitches(processedPitches);
      
      if (processedPitches.length === 0) {
        toast({
          title: "No Results",
          description: `No transfer pitches found for "${searchQuery}"`,
        });
      }
    } catch (error) {
      console.error('Error searching transfer pitches:', error);
      toast({
        title: "Search Error",
        description: "Failed to search transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPitch = async (pitchId: string) => {
    try {
      // Try to increment view count directly in the database
      const currentPitch = transferPitches.find(p => p.id === pitchId);
      const currentViewCount = currentPitch?.view_count || 0;

      const { error } = await supabase
        .from('transfer_pitches')
        .update({ view_count: currentViewCount + 1 })
        .eq('id', pitchId);

      if (error) {
        console.error('Error updating view count:', error);
      }

      toast({
        title: "Pitch Viewed",
        description: "Opening pitch details...",
      });
    } catch (error) {
      console.error('Error viewing pitch:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-[#111111] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-6 h-6" />
              Agent Explore Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search for players, positions, or teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-bright-pink hover:bg-bright-pink/90"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button 
                variant="outline"
                className="border-gray-600 hover:bg-gray-700"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-bright-pink" />
                  <span className="text-gray-400 text-sm">Active Pitches</span>
                </div>
                <p className="text-white text-2xl font-bold">{transferPitches.length}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-gray-400 text-sm">New Today</span>
                </div>
                <p className="text-white text-2xl font-bold">
                  {transferPitches.filter(p => 
                    new Date(p.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-400 text-sm">Premium Pitches</span>
                </div>
                <p className="text-white text-2xl font-bold">
                  {transferPitches.filter(p => (p.asking_price || 0) > 1000000).length}
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-400 text-sm">Countries</span>
                </div>
                <p className="text-white text-2xl font-bold">
                  {new Set(transferPitches.map(p => p.teams.country)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="pitches" className="text-white data-[state=active]:bg-bright-pink">
              Transfer Pitches
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-white data-[state=active]:bg-bright-pink">
              Agent Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitches" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Available Transfer Pitches</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : transferPitches.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Transfer Pitches Found
                    </h3>
                    <p className="text-gray-400">
                      {searchQuery 
                        ? `No results found for "${searchQuery}". Try adjusting your search terms.`
                        : "No active transfer pitches available at the moment."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {transferPitches.map((pitch) => (
                      <Card key={pitch.id} className="bg-gray-700 border-gray-600 hover:border-bright-pink/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Player Info */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-white font-bold text-lg mb-1">
                                  {pitch.players.full_name}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {pitch.players.position} • {pitch.players.age} years old
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-bright-pink font-bold text-xl">
                                  {formatCurrency(pitch.asking_price || 0, pitch.currency || 'USD')}
                                </p>
                                <p className="text-gray-400 text-sm capitalize">
                                  {pitch.transfer_type}
                                </p>
                              </div>
                            </div>

                            {/* Team & Location */}
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{pitch.teams.team_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{pitch.teams.country}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatTimeAgo(pitch.created_at)}</span>
                              </div>
                            </div>

                            {/* Player Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Nationality:</span>
                                <p className="text-white">{pitch.players.citizenship}</p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button 
                                onClick={() => handleViewPitch(pitch.id)}
                                className="flex-1 bg-bright-pink hover:bg-bright-pink/90"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1 border-gray-600 hover:bg-gray-600"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <ExploreRequests />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentExploreHub;
