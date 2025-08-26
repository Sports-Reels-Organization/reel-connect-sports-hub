
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Heart, 
  HeartOff, 
  MessageSquare, 
  Play, 
  Eye,
  MapPin,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimelinePitch {
  id: string;
  team_id: string;
  player_id: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  deal_stage: string;
  expires_at: string;
  created_at: string;
  view_count: number;
  message_count: number;
  shortlist_count: number;
  tagged_videos: any[];
  description?: string;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    headshot_url?: string;
    photo_url?: string;
    age?: number;
    market_value?: number;
  };
  teams: {
    id: string;
    team_name: string;
    country: string;
    logo_url?: string;
  };
}

const EnhancedAgentTimeline: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [pitches, setPitches] = useState<TimelinePitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [transferTypeFilter, setTransferTypeFilter] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState('');
  const [shortlistedPitches, setShortlistedPitches] = useState<Set<string>>(new Set());
  const [agentId, setAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'agent') {
      fetchAgentId();
    }
  }, [profile]);

  useEffect(() => {
    fetchPitches();
  }, []);

  useEffect(() => {
    if (agentId) {
      fetchShortlistedPitches();
    }
  }, [agentId]);

  const fetchAgentId = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) throw error;
      setAgentId(data.id);
    } catch (error) {
      console.error('Error fetching agent ID:', error);
    }
  };

  const fetchPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            headshot_url,
            photo_url,
            date_of_birth,
            market_value
          ),
          teams!inner(
            id,
            team_name,
            country,
            logo_url
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to add age calculation
      const processedData = (data || []).map(item => ({
        ...item,
        tagged_videos: Array.isArray(item.tagged_videos) ? item.tagged_videos : [],
        players: {
          ...item.players,
          age: item.players.date_of_birth
            ? new Date().getFullYear() - new Date(item.players.date_of_birth).getFullYear()
            : undefined
        }
      }));

      setPitches(processedData);
    } catch (error) {
      console.error('Error fetching pitches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlistedPitches = async () => {
    if (!agentId) return;

    try {
      const { data, error } = await supabase
        .from('agent_shortlist')
        .select('pitch_id')
        .eq('agent_id', agentId);

      if (error) throw error;

      const shortlistedIds = new Set((data || []).map(item => item.pitch_id));
      setShortlistedPitches(shortlistedIds);
    } catch (error) {
      console.error('Error fetching shortlisted pitches:', error);
    }
  };

  const filteredPitches = pitches.filter(pitch => {
    const matchesSearch = !searchTerm || 
      pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.players.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.teams.team_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPosition = !positionFilter || pitch.players.position === positionFilter;
    const matchesTransferType = !transferTypeFilter || pitch.transfer_type === transferTypeFilter;
    
    let matchesPrice = true;
    if (priceRangeFilter && pitch.asking_price) {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      matchesPrice = pitch.asking_price >= min && pitch.asking_price <= max;
    }

    return matchesSearch && matchesPosition && matchesTransferType && matchesPrice;
  });

  const toggleShortlist = async (pitch: TimelinePitch) => {
    if (!agentId) return;

    try {
      const isCurrentlyShortlisted = shortlistedPitches.has(pitch.id);

      if (isCurrentlyShortlisted) {
        // Remove from shortlist
        const { error } = await supabase
          .from('agent_shortlist')
          .delete()
          .eq('agent_id', agentId)
          .eq('pitch_id', pitch.id);

        if (error) throw error;

        setShortlistedPitches(prev => {
          const newSet = new Set(prev);
          newSet.delete(pitch.id);
          return newSet;
        });

        toast({
          title: "Removed from Shortlist",
          description: `${pitch.players.full_name} removed from your shortlist`,
        });
      } else {
        // Add to shortlist - include player_id which is required
        const { error } = await supabase
          .from('agent_shortlist')
          .insert({
            agent_id: agentId,
            pitch_id: pitch.id,
            player_id: pitch.player_id,
            notes: ''
          });

        if (error) throw error;

        setShortlistedPitches(prev => new Set([...prev, pitch.id]));

        toast({
          title: "Added to Shortlist",
          description: `${pitch.players.full_name} added to your shortlist`,
        });
      }
    } catch (error) {
      console.error('Error toggling shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to update shortlist",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (pitch: TimelinePitch) => {
    // Navigate to messages page with pre-filled data
    navigate('/messages', { 
      state: { 
        recipientId: pitch.team_id, 
        playerId: pitch.player_id,
        playerName: pitch.players.full_name 
      } 
    });
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-gray-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white font-polysans">
            <Filter className="w-5 h-5" />
            Filter Transfer Pitches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players, teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Positions</SelectItem>
                <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                <SelectItem value="Defender">Defender</SelectItem>
                <SelectItem value="Midfielder">Midfielder</SelectItem>
                <SelectItem value="Forward">Forward</SelectItem>
              </SelectContent>
            </Select>

            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Prices</SelectItem>
                <SelectItem value="0-100000">Under $100K</SelectItem>
                <SelectItem value="100000-500000">$100K - $500K</SelectItem>
                <SelectItem value="500000-1000000">$500K - $1M</SelectItem>
                <SelectItem value="1000000-5000000">$1M - $5M</SelectItem>
                <SelectItem value="5000000-999999999">Above $5M</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="text-white font-polysans">
            Transfer Pitches ({filteredPitches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPitches.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                No Pitches Found
              </h3>
              <p className="text-gray-400 font-poppins">
                Try adjusting your filters to see more results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPitches.map((pitch) => (
                <Card key={pitch.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Player Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                          {pitch.players.headshot_url || pitch.players.photo_url ? (
                            <img
                              src={pitch.players.headshot_url || pitch.players.photo_url}
                              alt={pitch.players.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-polysans font-bold text-white text-lg truncate">
                            {pitch.players.full_name}
                          </h3>
                          <p className="text-gray-300 font-poppins text-sm">
                            {pitch.players.position} • {pitch.players.citizenship}
                          </p>
                          {pitch.players.age && (
                            <p className="text-gray-400 text-xs">{pitch.players.age} years old</p>
                          )}
                        </div>
                      </div>

                      {/* Team Info */}
                      <div className="flex items-center gap-2">
                        {pitch.teams.logo_url && (
                          <img
                            src={pitch.teams.logo_url}
                            alt={pitch.teams.team_name}
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <MapPin className="h-3 w-3" />
                          <span>{pitch.teams.team_name}, {pitch.teams.country}</span>
                        </div>
                      </div>

                      {/* Transfer Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                            {pitch.transfer_type.toUpperCase()}
                          </Badge>
                          <div className="text-xs text-gray-400">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDaysLeft(pitch.expires_at)}
                          </div>
                        </div>

                        {pitch.asking_price && (
                          <div className="flex items-center gap-1 text-bright-pink font-bold text-lg">
                            <DollarSign className="h-5 w-5" />
                            {formatCurrency(pitch.asking_price, pitch.currency)}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {pitch.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {pitch.message_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {pitch.shortlist_count}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate(`/pitch/${pitch.id}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          View Details
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => toggleShortlist(pitch)}
                            variant={shortlistedPitches.has(pitch.id) ? "default" : "outline"}
                            size="sm"
                            className={`flex-1 ${shortlistedPitches.has(pitch.id) 
                              ? "bg-rosegold hover:bg-rosegold/90 text-white" 
                              : "border-gray-600 hover:bg-gray-700"
                            } transition-colors`}
                          >
                            {shortlistedPitches.has(pitch.id) ? (
                              <>
                                <Heart className="w-4 h-4 mr-1 fill-current" />
                                Saved
                              </>
                            ) : (
                              <>
                                <HeartOff className="w-4 h-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => sendMessage(pitch)}
                            size="sm"
                            className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>

                        {pitch.tagged_videos.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-600 hover:bg-gray-700"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Watch Videos ({pitch.tagged_videos.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAgentTimeline;
