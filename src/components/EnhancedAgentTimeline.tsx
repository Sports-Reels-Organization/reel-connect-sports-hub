
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MessageCircle, 
  Eye, 
  AlertCircle, 
  Search,
  Filter,
  Grid3X3,
  List,
  Play,
  MapPin,
  DollarSign,
  Heart,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelinePitch {
  id: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  deal_stage: string;
  expires_at: string;
  created_at: string;
  view_count: number;
  message_count: number;
  shortlist_count: number;
  is_international: boolean;
  description?: string;
  tagged_videos: any[];
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    photo_url?: string;
    age?: number;
    market_value?: number;
  };
  teams: {
    id: string;
    team_name: string;
    logo_url?: string;
    country: string;
  };
}

const EnhancedAgentTimeline: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<TimelinePitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<TimelinePitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at_desc');

  useEffect(() => {
    fetchTimelinePitches();
  }, [profile]);

  useEffect(() => {
    filterPitches();
  }, [pitches, searchTerm, filterPosition, filterStage, filterType, sortBy]);

  useEffect(() => {
    // Set up real-time subscription for new pitches
    if (profile?.id) {
      const subscription = supabase
        .channel('new-pitches')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'transfer_pitches',
            filter: 'status=eq.active'
          }, 
          (payload) => {
            toast({
              title: "New Transfer Pitch Available!",
              description: "A new player has been pitched for transfer.",
            });
            fetchTimelinePitches(); // Refresh the list
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile, toast]);

  const fetchTimelinePitches = async () => {
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
            photo_url,
            date_of_birth,
            market_value
          ),
          teams!inner(
            id,
            team_name,
            logo_url,
            country
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPitches: TimelinePitch[] = (data || []).map(pitch => ({
        id: pitch.id,
        asking_price: pitch.asking_price || 0,
        currency: pitch.currency || 'USD',
        transfer_type: pitch.transfer_type,
        deal_stage: pitch.deal_stage || 'pitch',
        expires_at: pitch.expires_at,
        created_at: pitch.created_at,
        view_count: pitch.view_count || 0,
        message_count: pitch.message_count || 0,
        shortlist_count: pitch.shortlist_count || 0,
        is_international: pitch.is_international || false,
        description: pitch.description,
        tagged_videos: Array.isArray(pitch.tagged_videos) ? pitch.tagged_videos : [],
        players: {
          id: pitch.players.id,
          full_name: pitch.players.full_name,
          position: pitch.players.position,
          citizenship: pitch.players.citizenship,
          photo_url: pitch.players.photo_url,
          age: pitch.players.date_of_birth 
            ? new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear()
            : 0,
          market_value: pitch.players.market_value
        },
        teams: {
          id: pitch.teams.id,
          team_name: pitch.teams.team_name,
          logo_url: pitch.teams.logo_url,
          country: pitch.teams.country
        }
      }));

      setPitches(transformedPitches);
    } catch (error) {
      console.error('Error fetching timeline pitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer timeline",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPitches = () => {
    let filtered = [...pitches];

    if (searchTerm) {
      filtered = filtered.filter(pitch =>
        pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.teams.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.players.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPosition && filterPosition !== 'all') {
      filtered = filtered.filter(pitch =>
        pitch.players.position.toLowerCase().includes(filterPosition.toLowerCase())
      );
    }

    if (filterStage && filterStage !== 'all') {
      filtered = filtered.filter(pitch =>
        pitch.deal_stage === filterStage
      );
    }

    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(pitch =>
        pitch.transfer_type === filterType
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name_asc':
        filtered.sort((a, b) => a.players.full_name.localeCompare(b.players.full_name));
        break;
      case 'expires_asc':
        filtered.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.asking_price - a.asking_price);
        break;
      default: // created_at_desc
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredPitches(filtered);
  };

  const addToShortlist = async (pitchId: string) => {
    if (!profile?.id) return;

    try {
      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) {
        toast({
          title: "Error",
          description: "Agent profile not found",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('shortlist')
        .insert({
          agent_id: agentData.id,
          pitch_id: pitchId,
          notes: ''
        });

      if (error) throw error;

      toast({
        title: "Added to Shortlist",
        description: "Player has been added to your shortlist",
      });

      // Update shortlist count
      fetchTimelinePitches();
    } catch (error) {
      console.error('Error adding to shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to add to shortlist",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (pitchId: string, playerId: string) => {
    if (!profile?.id) return;

    try {
      // Get the pitch details first to get team information
      const pitch = pitches.find(p => p.id === pitchId);
      if (!pitch) return;

      // Get team profile ID from teams table
      const { data: teamData } = await supabase
        .from('teams')
        .select('profile_id')
        .eq('id', pitch.teams.id)
        .single();

      if (!teamData) {
        toast({
          title: "Error",
          description: "Team profile not found",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.id,
          receiver_id: teamData.profile_id,
          player_id: playerId,
          pitch_id: pitchId,
          subject: `Inquiry about ${pitch.players.full_name}`,
          content: `I'm interested in discussing the transfer of ${pitch.players.full_name}. Please let me know if we can arrange a conversation.`,
          message_type: 'inquiry'
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent to the team",
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

  const handleViewDetails = (pitch: TimelinePitch) => {
    navigate(`/transfer-pitch/${pitch.id}`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'pitch': return 'bg-blue-500';
      case 'interest': return 'bg-yellow-500';
      case 'discussion': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderPitchCard = (pitch: TimelinePitch) => (
    <Card 
      key={pitch.id} 
      className={`border-gray-600 ${isExpiringSoon(pitch.expires_at) ? 'border-red-500 border-2' : 'hover:border-rosegold/50'} transition-colors`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Player and Team Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {pitch.players.photo_url && (
                <img
                  src={pitch.players.photo_url}
                  alt={pitch.players.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {pitch.players.full_name}
                </h3>
                <p className="text-sm text-gray-400">
                  {pitch.players.position} • {pitch.players.citizenship}
                  {pitch.players.age && ` • ${pitch.players.age}y`}
                </p>
                
                {/* Team Info with Logo */}
                <div className="flex items-center gap-2 mt-1">
                  {pitch.teams.logo_url && (
                    <img
                      src={pitch.teams.logo_url}
                      alt={pitch.teams.team_name}
                      className="w-4 h-4 rounded"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    {pitch.teams.team_name} • {pitch.teams.country}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-rosegold">
                {formatCurrency(pitch.asking_price, pitch.currency)}
              </div>
              <div className="text-xs text-gray-400">
                {pitch.transfer_type.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Status and Badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getDealStageColor(pitch.deal_stage)} text-white border-none`}
              >
                {pitch.deal_stage.toUpperCase()}
              </Badge>
              {pitch.is_international && (
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  International
                </Badge>
              )}
              {isExpiringSoon(pitch.expires_at) && (
                <Badge variant="outline" className="text-red-400 border-red-400 animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Expiring Soon
                </Badge>
              )}
              {pitch.tagged_videos.length > 0 && (
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  <Play className="w-3 h-3 mr-1" />
                  {pitch.tagged_videos.length} Videos
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Expires {formatDistanceToNow(new Date(pitch.expires_at), { addSuffix: true })}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {pitch.view_count}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {pitch.message_count}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {pitch.shortlist_count} shortlisted
            </div>
          </div>

          {/* Description */}
          {pitch.description && (
            <p className="text-sm text-gray-300 line-clamp-2">
              {pitch.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(pitch)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => addToShortlist(pitch.id)}
              className="border-pink-600 text-pink-300 hover:bg-pink-700/20"
            >
              <Heart className="w-4 h-4 mr-1" />
              Shortlist
            </Button>
            
            <Button
              size="sm"
              className="bg-rosegold hover:bg-rosegold/90 text-white"
              onClick={() => sendMessage(pitch.id, pitch.players.id)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card className='border-0'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5" />
              Agent Transfer Timeline ({filteredPitches.length})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players, teams, positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="forward">Forward</SelectItem>
                <SelectItem value="midfielder">Midfielder</SelectItem>
                <SelectItem value="defender">Defender</SelectItem>
                <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="pitch">New Pitch</SelectItem>
                <SelectItem value="interest">Interest Shown</SelectItem>
                <SelectItem value="discussion">In Discussion</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Latest Pitches</SelectItem>
                <SelectItem value="expires_asc">Expiring Soon</SelectItem>
                <SelectItem value="price_desc">Highest Price</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeline Content */}
          {filteredPitches.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Active Pitches
              </h3>
              <p className="text-gray-400">
                {searchTerm || filterPosition !== 'all' || filterStage !== 'all' || filterType !== 'all'
                  ? 'No pitches match your current filters.'
                  : 'No transfer pitches are currently active on the timeline.'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
              {filteredPitches.map(pitch => renderPitchCard(pitch))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAgentTimeline;
