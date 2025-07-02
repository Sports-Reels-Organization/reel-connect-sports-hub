
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, MapPin, Plus, User, DollarSign, Clock, Calendar, Search, Filter, Star, Eye, TrendingUp, Trophy, Flag } from 'lucide-react';
import { MessageModal } from '@/components/MessageModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface TransferPitch {
  id: string;
  description: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  status: string;
  created_at: string;
  expires_at: string;
  player_id: string;
  team_id: string;
  loan_fee?: number;
  view_count?: number;
  message_count?: number;
  shortlist_count?: number;
  is_featured?: boolean;
  player_name?: string;
  player_position?: string;
  player_citizenship?: string;
  player_market_value?: number;
  player_age?: number;
  player_photo_url?: string;
  team_name?: string;
  team_country?: string;
  team_logo_url?: string;
  member_association?: string;
  team_profile_id?: string;
}

const AgentDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<TransferPitch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    if (profile?.id) {
      fetchActivePitches();
    }
  }, [profile?.id]);

  const fetchActivePitches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            height,
            weight,
            photo_url,
            jersey_number,
            bio,
            market_value,
            age
          ),
          teams!inner(
            id,
            team_name,
            country,
            logo_url,
            member_association
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching pitches:', error);
        return;
      }

      const transformedPitches = (data || []).map(pitch => {
        const playerData = Array.isArray(pitch.players) ? pitch.players[0] : pitch.players;
        const teamData = Array.isArray(pitch.teams) ? pitch.teams[0] : pitch.teams;

        return {
          ...pitch,
          player_name: playerData?.full_name,
          player_position: playerData?.position,
          player_citizenship: playerData?.citizenship,
          player_market_value: playerData?.market_value,
          player_age: playerData?.age,
          player_photo_url: playerData?.photo_url,
          team_name: teamData?.team_name,
          team_country: teamData?.country,
          team_logo_url: teamData?.logo_url,
          member_association: teamData?.member_association
        };
      });

      setPitches(transformedPitches);
    } catch (error) {
      console.error('Error in fetchActivePitches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (pitch: TransferPitch) => {
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('profile_id, team_name')
        .eq('id', pitch.team_id)
        .single();

      if (teamError || !teamData) {
        toast({
          title: "Error",
          description: "Could not find team information",
          variant: "destructive"
        });
        return;
      }

      setSelectedPitch({
        ...pitch,
        team_profile_id: teamData.profile_id
      });
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error getting team info:', error);
      toast({
        title: "Error",
        description: "Failed to get team information",
        variant: "destructive"
      });
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

  const formatDaysLeft = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 0) return 'Expired';
    if (diffInDays === 1) return '1 day left';
    return `${diffInDays} days left`;
  };

  const filteredAndSortedPitches = pitches
    .filter(pitch => {
      const matchesSearch = 
        pitch.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.player_position?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'permanent' && pitch.transfer_type === 'permanent') ||
        (filterType === 'loan' && pitch.transfer_type === 'loan') ||
        (filterType === 'featured' && pitch.is_featured);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_high':
          return (b.asking_price || 0) - (a.asking_price || 0);
        case 'price_low':
          return (a.asking_price || 0) - (b.asking_price || 0);
        case 'expiring':
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        default:
          return 0;
      }
    });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-polysans font-bold text-white mb-2">
                Agent Dashboard
              </h1>
              <p className="text-gray-400 font-poppins text-lg">
                Discover exceptional players and manage your transfer activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-rosegold border-rosegold px-4 py-2">
                {pitches.length} Active Pitches
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search players, teams, positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transfers</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center text-sm text-gray-400">
                <Eye className="w-4 h-4 mr-2" />
                Showing {filteredAndSortedPitches.length} results
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-gray-700 bg-gray-800/30 animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-20 bg-gray-700 rounded"></div>
                    <div className="h-8 bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedPitches.length === 0 ? (
          <Card className="border-gray-700 bg-gray-800/30">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rosegold to-bright-pink rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-polysans font-semibold text-white mb-3">
                {searchTerm || filterType !== 'all' ? 'No Matches Found' : 'No Active Transfer Pitches'}
              </h3>
              <p className="text-gray-400 font-poppins text-lg mb-6">
                {searchTerm || filterType !== 'all' 
                  ? "Try adjusting your search criteria or filters to find more opportunities"
                  : "There are currently no active player transfer opportunities available. Check back soon for new listings."
                }
              </p>
              {(searchTerm || filterType !== 'all') && (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="bg-rosegold hover:bg-rosegold/90 text-white"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPitches.map((pitch) => (
              <Card 
                key={pitch.id} 
                className="border-gray-700 bg-gray-800/30 backdrop-blur-sm hover:bg-gray-800/50 hover:border-rosegold/50 transition-all duration-300 group hover:shadow-xl hover:shadow-rosegold/10"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Featured Badge */}
                    {pitch.is_featured && (
                      <div className="flex justify-end">
                        <Badge className="bg-gradient-to-r from-rosegold to-bright-pink text-white border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Player Header */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 border-2 border-gray-600 group-hover:border-rosegold transition-colors">
                          {pitch.player_photo_url ? (
                            <AvatarImage src={pitch.player_photo_url} alt={pitch.player_name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-600 text-white">
                              <User className="w-6 h-6" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {pitch.team_logo_url && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-gray-800">
                            <img src={pitch.team_logo_url} alt={pitch.team_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-polysans font-bold text-white text-lg truncate group-hover:text-rosegold transition-colors">
                          {pitch.player_name || 'Unknown Player'}
                        </h3>
                        <p className="text-gray-300 font-poppins text-sm">
                          {pitch.player_position || 'Unknown Position'} 
                          {pitch.player_age && ` • ${pitch.player_age}y`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'} className="text-xs">
                            {pitch.transfer_type?.toUpperCase()}
                          </Badge>
                          {pitch.player_citizenship && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                              <Flag className="w-3 h-3 mr-1" />
                              {pitch.player_citizenship}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 rounded-lg p-3">
                      <MapPin className="h-4 w-4 text-rosegold" />
                      <span className="font-medium">{pitch.team_name}</span>
                      <span>•</span>
                      <span>{pitch.team_country || 'Unknown'}</span>
                    </div>

                    {/* Description */}
                    {pitch.description && (
                      <p className="text-gray-300 font-poppins text-sm line-clamp-3 leading-relaxed">
                        {pitch.description}
                      </p>
                    )}

                    {/* Price Section */}
                    <div className="space-y-3">
                      {pitch.transfer_type === 'permanent' && pitch.asking_price && (
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-bright-pink/10 to-rosegold/10 rounded-lg border border-bright-pink/20">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-bright-pink" />
                            <span className="text-sm text-gray-400">Transfer Fee</span>
                          </div>
                          <span className="text-lg font-bold text-bright-pink">
                            {formatCurrency(pitch.asking_price, pitch.currency)}
                          </span>
                        </div>
                      )}
                      
                      {pitch.transfer_type === 'loan' && pitch.loan_fee && (
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-blue-400" />
                            <span className="text-sm text-gray-400">Loan Fee</span>
                          </div>
                          <span className="text-lg font-bold text-blue-400">
                            {formatCurrency(pitch.loan_fee, pitch.currency)}
                          </span>
                        </div>
                      )}

                      {pitch.player_market_value && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Market Value</span>
                          <span className="text-white font-medium">
                            {formatCurrency(pitch.player_market_value, pitch.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(pitch.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDaysLeft(pitch.expires_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {pitch.view_count && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {pitch.view_count}
                          </div>
                        )}
                        {pitch.message_count && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {pitch.message_count}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleMessageClick(pitch)}
                      className="w-full bg-gradient-to-r from-bright-pink to-rosegold hover:from-bright-pink/90 hover:to-rosegold/90 text-white font-poppins font-medium transition-all duration-300 hover:shadow-lg hover:shadow-rosegold/25"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && selectedPitch && (
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => {
              setShowMessageModal(false);
              setSelectedPitch(null);
            }}
            pitchId={selectedPitch.id}
            receiverId={selectedPitch.team_profile_id}
            receiverName={selectedPitch.team_name || 'Unknown Team'}
            receiverType="team"
            pitchTitle={selectedPitch.description}
            currentUserId={profile?.id || ''}
            playerName={selectedPitch.player_name || 'Unknown Player'}
          />
        )}
      </div>
    </Layout>
  );
};

export default AgentDashboard;
