
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageSquare, Calendar, DollarSign, MapPin, User, Trash2, Search, Filter, PlayCircle, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EnhancedVideoAnalysis from '@/components/EnhancedVideoAnalysis';

interface ShortlistItem {
  id: string;
  player_id: string;
  pitch_id: string;
  notes?: string;
  priority_level: 'high' | 'medium' | 'low';
  created_at: string;
  player: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    headshot_url?: string;
    photo_url?: string;
    market_value?: number;
    age?: number;
    date_of_birth?: string;
  };
  pitch: {
    id: string;
    asking_price?: number;
    currency: string;
    transfer_type: string;
    expires_at: string;
    status: string;
    team: {
      id: string;
      team_name: string;
      country: string;
      logo_url?: string;
    };
  };
}

const AgentShortlistEnhanced = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [shortlistItems, setShortlistItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchShortlistItems();
  }, [profile]);

  const fetchShortlistItems = async () => {
    if (!profile?.id) return;

    try {
      // First get the agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('agent_shortlist')
        .select(`
          id,
          player_id,
          pitch_id,
          notes,
          priority_level,
          created_at
        `)
        .eq('agent_id', agentData.id);

      if (error) throw error;

      if (!data) {
        setShortlistItems([]);
        setLoading(false);
        return;
      }

      // Fetch additional data for each shortlisted item
      const enrichedData = await Promise.all(
        data.map(async (item) => {
          // Fetch player data
          const { data: playerData } = await supabase
            .from('players')
            .select('id, full_name, position, citizenship, headshot_url, photo_url, market_value, date_of_birth')
            .eq('id', item.player_id)
            .single();

          // Fetch pitch data with team
          const { data: pitchData } = await supabase
            .from('transfer_pitches')
            .select(`
              id,
              asking_price,
              currency,
              transfer_type,
              expires_at,
              status,
              team_id
            `)
            .eq('id', item.pitch_id)
            .single();

          let teamData = null;
          if (pitchData?.team_id) {
            const { data: team } = await supabase
              .from('teams')
              .select('id, team_name, country, logo_url')
              .eq('id', pitchData.team_id)
              .single();
            teamData = team;
          }

          return {
            ...item,
            player: {
              ...playerData,
              age: playerData?.date_of_birth
                ? new Date().getFullYear() - new Date(playerData.date_of_birth).getFullYear()
                : undefined
            },
            pitch: {
              ...pitchData,
              team: teamData || { id: '', team_name: 'Unknown Team', country: 'Unknown' }
            }
          };
        })
      );

      setShortlistItems(enrichedData.filter(item => item.player && item.pitch));
    } catch (error) {
      console.error('Error fetching shortlist items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shortlisted players",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromShortlist = async (shortlistId: string) => {
    try {
      const { error } = await supabase
        .from('agent_shortlist')
        .delete()
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.filter(item => item.id !== shortlistId));
      
      toast({
        title: "Success",
        description: "Player removed from shortlist",
      });
    } catch (error) {
      console.error('Error removing from shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove player from shortlist",
        variant: "destructive"
      });
    }
  };

  const updatePriority = async (shortlistId: string, newPriority: 'high' | 'medium' | 'low') => {
    try {
      const { error } = await supabase
        .from('agent_shortlist')
        .update({ priority_level: newPriority })
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => 
        prev.map(item => 
          item.id === shortlistId 
            ? { ...item, priority_level: newPriority }
            : item
        )
      );
      
      toast({
        title: "Success",
        description: "Priority updated successfully",
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

  const addNote = async (shortlistId: string, note: string) => {
    try {
      const { error } = await supabase
        .from('agent_shortlist')
        .update({ notes: note })
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => 
        prev.map(item => 
          item.id === shortlistId 
            ? { ...item, notes: note }
            : item
        )
      );
      
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const filteredAndSortedItems = shortlistItems
    .filter(item => {
      const matchesSearch = item.player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.pitch.team.team_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || item.priority_level === priorityFilter;
      const matchesPosition = positionFilter === 'all' || item.player.position === positionFilter;
      
      return matchesSearch && matchesPriority && matchesPosition;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority_level] - priorityOrder[a.priority_level];
        case 'price_high':
          return (b.pitch.asking_price || 0) - (a.pitch.asking_price || 0);
        case 'price_low':
          return (a.pitch.asking_price || 0) - (b.pitch.asking_price || 0);
        default:
          return 0;
      }
    });

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const uniquePositions = [...new Set(shortlistItems.map(item => item.player.position))];

  if (loading) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Video Analysis Modal */}
      {selectedVideoId && selectedTeamId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Video Analysis</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedVideoId(null);
                  setSelectedTeamId(null);
                }}
              >
                ×
              </Button>
            </div>
            <EnhancedVideoAnalysis
              videoId={selectedVideoId}
              onAnalysisComplete={() => {
                setSelectedVideoId(null);
                setSelectedTeamId(null);
              }}
            />
          </div>
        </div>
      )}

      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white font-polysans">
            <Heart className="w-5 h-5 text-bright-pink" />
            Enhanced Shortlist ({filteredAndSortedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grid" className="w-full">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <TabsList className="grid w-full lg:w-auto grid-cols-2">
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              
              {/* Search and Filters */}
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search players, positions, teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniquePositions.map(position => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="price_high">Price (High-Low)</SelectItem>
                    <SelectItem value="price_low">Price (Low-High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="grid">
              {filteredAndSortedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                    No Players Match Your Filters
                  </h3>
                  <p className="text-gray-400 font-poppins">
                    Try adjusting your search criteria or add more players to your shortlist.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedItems.map((item) => (
                    <Card key={item.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Priority Indicator */}
                          <div className="flex items-center justify-between">
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority_level)}`}></div>
                            <Select
                              value={item.priority_level}
                              onValueChange={(value: 'high' | 'medium' | 'low') => updatePriority(item.id, value)}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Player Header */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                              {item.player.headshot_url || item.player.photo_url ? (
                                <img
                                  src={item.player.headshot_url || item.player.photo_url}
                                  alt={item.player.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-polysans font-bold text-white text-sm">
                                {item.player.full_name}
                              </h3>
                              <p className="text-gray-300 font-poppins text-xs">
                                {item.player.position} • {item.player.citizenship}
                              </p>
                            </div>
                            <Button
                              onClick={() => removeFromShortlist(item.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Team Info */}
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>{item.pitch.team.team_name}, {item.pitch.team.country}</span>
                          </div>

                          {/* Transfer Info */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant={item.pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                                {item.pitch.transfer_type.toUpperCase()}
                              </Badge>
                              <div className="text-xs text-gray-400">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {formatDaysLeft(item.pitch.expires_at)}
                              </div>
                            </div>

                            {item.pitch.asking_price && (
                              <div className="flex items-center gap-1 text-bright-pink font-bold">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(item.pitch.asking_price, item.pitch.currency)}
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <div className="p-2 bg-gray-800 rounded text-xs text-gray-300">
                              {item.notes}
                            </div>
                          )}

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
                              onClick={() => {
                                // This would open a video analysis modal
                                setSelectedVideoId('sample-video-id');
                                setSelectedTeamId(item.pitch.team.id);
                              }}
                            >
                              <PlayCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <BarChart3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="list">
              {/* List view implementation would go here */}
              <div className="text-center py-12">
                <p className="text-gray-400">List view coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentShortlistEnhanced;
