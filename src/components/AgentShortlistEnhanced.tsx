
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Heart, MessageSquare, Eye, Clock, DollarSign, 
  MapPin, User, Trash2, Star, Filter, Search,
  Play, BarChart3, Download, Share
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EnhancedVideoAnalysis from './EnhancedVideoAnalysis';

interface ShortlistItem {
  id: string;
  notes: string;
  created_at: string;
  priority_level?: 'high' | 'medium' | 'low';
  player: {
    id: string;
    full_name: string;
    position: string;
    age: number;
    photo_url?: string;
    market_value?: number;
    citizenship: string;
  };
  pitch: {
    id: string;
    expires_at: string;
    asking_price?: number;
    currency: string;
    transfer_type: string;
    team: {
      team_name: string;
      country: string;
      logo_url?: string;
    };
    tagged_videos?: any[];
  };
}

const AgentShortlistEnhanced = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [shortlistItems, setShortlistItems] = useState<ShortlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTransferType, setFilterTransferType] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<ShortlistItem | null>(null);
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  useEffect(() => {
    fetchShortlist();
  }, [profile]);

  useEffect(() => {
    filterShortlist();
  }, [shortlistItems, searchTerm, filterPosition, filterPriority, filterTransferType]);

  const fetchShortlist = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      const { data, error } = await supabase
        .from('shortlist')
        .select(`
          *,
          player:players!inner(
            id,
            full_name,
            position,
            date_of_birth,
            photo_url,
            market_value,
            citizenship
          ),
          pitch:transfer_pitches!inner(
            id,
            expires_at,
            asking_price,
            currency,
            transfer_type,
            tagged_videos,
            team:teams!inner(
              team_name,
              country,
              logo_url
            )
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to calculate age and handle tagged_videos
      const processedData = (data || []).map(item => ({
        ...item,
        player: {
          ...item.player,
          age: item.player.date_of_birth 
            ? new Date().getFullYear() - new Date(item.player.date_of_birth).getFullYear()
            : 0
        },
        priority_level: item.priority_level || 'medium',
        pitch: {
          ...item.pitch,
          tagged_videos: Array.isArray(item.pitch.tagged_videos) 
            ? item.pitch.tagged_videos 
            : []
        }
      }));

      setShortlistItems(processedData);
    } catch (error) {
      console.error('Error fetching shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to load shortlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterShortlist = () => {
    let filtered = shortlistItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pitch.team.team_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPosition) {
      filtered = filtered.filter(item =>
        item.player.position.toLowerCase().includes(filterPosition.toLowerCase())
      );
    }

    if (filterPriority) {
      filtered = filtered.filter(item =>
        item.priority_level === filterPriority
      );
    }

    if (filterTransferType) {
      filtered = filtered.filter(item =>
        item.pitch.transfer_type === filterTransferType
      );
    }

    setFilteredItems(filtered);
  };

  const updatePriority = async (shortlistId: string, priority: 'high' | 'medium' | 'low') => {
    try {
      const { error } = await supabase
        .from('shortlist')
        .update({ priority_level: priority })
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.map(item => 
        item.id === shortlistId ? { ...item, priority_level: priority } : item
      ));

      toast({
        title: "Priority Updated",
        description: "Player priority level has been updated",
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      });
    }
  };

  const updateNotes = async (shortlistId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('shortlist')
        .update({ notes })
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.map(item => 
        item.id === shortlistId ? { ...item, notes } : item
      ));

      toast({
        title: "Notes Updated",
        description: "Player notes have been saved",
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      });
    }
  };

  const removeFromShortlist = async (shortlistId: string) => {
    if (!confirm('Remove this player from your shortlist?')) return;

    try {
      const { error } = await supabase
        .from('shortlist')
        .delete()
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.filter(item => item.id !== shortlistId));
      
      toast({
        title: "Removed",
        description: "Player removed from shortlist",
      });
    } catch (error) {
      console.error('Error removing from shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from shortlist",
        variant: "destructive"
      });
    }
  };

  const viewPlayerVideos = async (playerId: string) => {
    try {
      const { data: videos } = await supabase
        .from('videos')
        .select('*')
        .contains('tagged_players', [playerId])
        .limit(1);

      if (videos && videos.length > 0) {
        setSelectedVideo(videos[0]);
        setShowVideoAnalysis(true);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  if (showVideoAnalysis && selectedVideo) {
    return (
      <EnhancedVideoAnalysis
        videoId={selectedVideo.id}
        videoUrl={selectedVideo.video_url}
        videoTitle={selectedVideo.title}
        videoMetadata={{
          playerTags: selectedVideo.tagged_players || [],
          matchDetails: {
            homeTeam: selectedVideo.home_or_away === 'home' ? 'Home Team' : 'Away Team',
            awayTeam: selectedVideo.opposing_team,
            league: 'League',
            finalScore: selectedVideo.score || '0-0'
          },
          duration: selectedVideo.duration || 300,
          videoDescription: selectedVideo.description
        }}
        onClose={() => {
          setShowVideoAnalysis(false);
          setSelectedVideo(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white font-polysans flex items-center gap-2">
            <Heart className="w-8 h-8 text-bright-pink" />
            Enhanced Shortlist
          </h2>
          <p className="text-gray-400 mt-1">
            {filteredItems.length} player{filteredItems.length !== 1 ? 's' : ''} shortlisted
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-700 border-gray-600"
              />
            </div>

            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Positions</SelectItem>
                <SelectItem value="forward">Forward</SelectItem>
                <SelectItem value="midfielder">Midfielder</SelectItem>
                <SelectItem value="defender">Defender</SelectItem>
                <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTransferType} onValueChange={setFilterTransferType}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterPosition('');
                setFilterPriority('');
                setFilterTransferType('');
              }}
              className="border-gray-600"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shortlist Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-gray-800">
              <CardContent className="p-4">
                <div className="h-48 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {shortlistItems.length === 0 ? 'No Players Shortlisted' : 'No Players Match Filters'}
            </h3>
            <p className="text-gray-400">
              {shortlistItems.length === 0 
                ? "Start exploring the timeline to shortlist players you're interested in."
                : "Try adjusting your search filters to find more players."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className={`border-gray-600 hover:border-rosegold/50 transition-colors ${
                isExpired(item.pitch.expires_at) ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-0">
                {/* Player Header */}
                <div className="relative">
                  <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 p-4 flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4">
                      {item.player.photo_url ? (
                        <img
                          src={item.player.photo_url}
                          alt={item.player.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-polysans font-bold text-white text-lg line-clamp-1">
                        {item.player.full_name}
                      </h3>
                      <p className="text-gray-300 font-poppins text-sm">
                        {item.player.position} • Age {item.player.age}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-400 text-xs">{item.player.citizenship}</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <div className="absolute top-2 right-2">
                    <Select 
                      value={item.priority_level} 
                      onValueChange={(value) => updatePriority(item.id, value as any)}
                    >
                      <SelectTrigger className="w-auto h-auto p-1 border-0 bg-transparent">
                        <Badge className={`${getPriorityColor(item.priority_level)} text-white text-xs`}>
                          <Star className="w-3 h-3 mr-1" />
                          {item.priority_level.toUpperCase()}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Expired Badge */}
                  {isExpired(item.pitch.expires_at) && (
                    <Badge variant="destructive" className="absolute bottom-2 left-2 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* Team & Transfer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{item.pitch.team.team_name}, {item.pitch.team.country}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={item.pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}
                      >
                        {item.pitch.transfer_type.toUpperCase()}
                      </Badge>
                      
                      {!isExpired(item.pitch.expires_at) && (
                        <div className="text-xs text-gray-400">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDistanceToNow(new Date(item.pitch.expires_at))} left
                        </div>
                      )}
                    </div>

                    {item.pitch.asking_price && (
                      <div className="flex items-center gap-1 text-bright-pink font-bold">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(item.pitch.asking_price, item.pitch.currency)}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <Textarea
                      placeholder="Add your notes about this player..."
                      value={item.notes || ''}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      className="bg-gray-800 border-gray-600 text-xs min-h-16 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-xs"
                      onClick={() => viewPlayerVideos(item.player.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Videos
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-xs"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => removeFromShortlist(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentShortlistEnhanced;
