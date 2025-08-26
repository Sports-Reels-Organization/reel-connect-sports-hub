
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MessageCircle, 
  Eye, 
  AlertCircle, 
  TrendingUp, 
  Search,
  Filter,
  Grid3X3,
  List,
  Edit,
  Trash2,
  Play,
  MapPin,
  Building2,
  Users,
  DollarSign
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

const EnhancedTransferTimeline: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<TimelinePitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchTimelinePitches();
  }, [profile]);

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
            age,
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
        tagged_videos: pitch.tagged_videos || [],
        players: {
          id: pitch.players.id,
          full_name: pitch.players.full_name,
          position: pitch.players.position,
          citizenship: pitch.players.citizenship,
          photo_url: pitch.players.photo_url,
          age: pitch.players.age,
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

  const filteredPitches = pitches.filter(pitch => {
    const matchesSearch = 
      pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.teams.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.players.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = filterStage === 'all' || pitch.deal_stage === filterStage;
    const matchesType = filterType === 'all' || pitch.transfer_type === filterType;
    
    return matchesSearch && matchesStage && matchesType;
  });

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'pitch': return 'bg-blue-500';
      case 'interest': return 'bg-yellow-500';
      case 'discussion': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDealStageText = (stage: string) => {
    switch (stage) {
      case 'pitch': return 'New Pitch';
      case 'interest': return 'Interest Shown';
      case 'discussion': return 'In Discussion';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const canEditPitch = (pitch: TimelinePitch) => {
    return profile?.user_type === 'team'; // Only teams can edit their pitches
  };

  const handleViewDetails = (pitch: TimelinePitch) => {
    navigate(`/transfer-pitch/${pitch.id}`);
  };

  const handleEditPitch = (pitchId: string) => {
    navigate(`/edit-pitch/${pitchId}`);
  };

  const handleDeletePitch = async (pitchId: string) => {
    if (!confirm('Are you sure you want to delete this pitch?')) return;

    try {
      const { error } = await supabase
        .from('transfer_pitches')
        .delete()
        .eq('id', pitchId);

      if (error) throw error;

      setPitches(prev => prev.filter(p => p.id !== pitchId));
      toast({
        title: "Success",
        description: "Transfer pitch deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting pitch:', error);
      toast({
        title: "Error",
        description: "Failed to delete pitch",
        variant: "destructive"
      });
    }
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
                {getDealStageText(pitch.deal_stage)}
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
              <TrendingUp className="w-4 h-4" />
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
            
            {canEditPitch(pitch) && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditPitch(pitch.id)}
                  className="border-yellow-600 text-yellow-300 hover:bg-yellow-700/20"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeletePitch(pitch.id)}
                  className="border-red-600 text-red-300 hover:bg-red-700/20"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
            
            {profile?.user_type === 'agent' && (
              <Button
                size="sm"
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Send Message
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderListView = (pitch: TimelinePitch) => (
    <Card key={pitch.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {pitch.players.photo_url && (
              <img
                src={pitch.players.photo_url}
                alt={pitch.players.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{pitch.players.full_name}</h3>
                <Badge variant="outline" className="text-xs">
                  {pitch.players.position}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {pitch.teams.logo_url && (
                  <img src={pitch.teams.logo_url} alt="" className="w-4 h-4 rounded" />
                )}
                <span>{pitch.teams.team_name}</span>
                <span>•</span>
                <span>{pitch.players.citizenship}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-bold text-rosegold">
                {formatCurrency(pitch.asking_price, pitch.currency)}
              </div>
              <div className="text-xs text-gray-400">
                {pitch.transfer_type}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={`${getDealStageColor(pitch.deal_stage)} text-white border-none`}>
                {getDealStageText(pitch.deal_stage)}
              </Badge>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(pitch)}
              >
                View Details
              </Button>
            </div>
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
              <TrendingUp className="w-5 h-5" />
              Transfer Timeline ({filteredPitches.length})
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
          </div>

          {/* Timeline Content */}
          {filteredPitches.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Active Pitches
              </h3>
              <p className="text-gray-400">
                {searchTerm || filterStage !== 'all' || filterType !== 'all'
                  ? 'No pitches match your current filters.'
                  : 'No transfer pitches are currently active on the timeline.'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
              {filteredPitches.map(pitch => 
                viewMode === 'grid' ? renderPitchCard(pitch) : renderListView(pitch)
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTransferTimeline;
