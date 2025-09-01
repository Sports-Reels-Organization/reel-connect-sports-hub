
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageSquare, Calendar, DollarSign, MapPin, User, Star } from 'lucide-react';

interface TransferPitch {
  id: string;
  asking_price?: number;
  currency: string;
  transfer_type: string;
  expires_at: string;
  status: string;
  view_count?: number;
  message_count?: number;
  shortlist_count?: number;
  player: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    photo_url?: string;
    headshot_url?: string;
  };
  team: {
    team_name: string;
    country: string;
    logo_url?: string;
  };
}

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  position?: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  expires_at: string;
  created_at: string;
  agent: {
    agency_name: string;
  };
}

const ExploreHub = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transferPitches, setTransferPitches] = useState<TransferPitch[]>([]);
  const [agentRequests, setAgentRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch transfer pitches
      const { data: pitchesData, error: pitchesError } = await supabase
        .from('transfer_pitches')
        .select(`
          id,
          asking_price,
          currency,
          transfer_type,
          expires_at,
          status,
          view_count,
          message_count,
          shortlist_count,
          player_id,
          team_id
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(6);

      if (pitchesError) throw pitchesError;

      // Enrich pitches with player and team data
      if (pitchesData) {
        const enrichedPitches = await Promise.all(
          pitchesData.map(async (pitch) => {
            const [playerResult, teamResult] = await Promise.all([
              supabase
                .from('players')
                .select('id, full_name, position, citizenship, photo_url, headshot_url')
                .eq('id', pitch.player_id)
                .single(),
              supabase
                .from('teams')
                .select('team_name, country, logo_url')
                .eq('id', pitch.team_id)
                .single()
            ]);

            return {
              ...pitch,
              player: playerResult.data || { id: '', full_name: 'Unknown Player', position: '', citizenship: '' },
              team: teamResult.data || { team_name: 'Unknown Team', country: '' }
            };
          })
        );

        setTransferPitches(enrichedPitches);
      }

      // Fetch agent requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('agent_requests')
        .select(`
          id,
          title,
          description,
          sport_type,
          position,
          budget_min,
          budget_max,
          currency,
          expires_at,
          created_at,
          agent_id
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(4);

      if (requestsError) throw requestsError;

      // Enrich requests with agent data
      if (requestsData) {
        const enrichedRequests = await Promise.all(
          requestsData.map(async (request) => {
            const { data: agentData } = await supabase
              .from('agents')
              .select('agency_name')
              .eq('id', request.agent_id)
              .single();

            return {
              ...request,
              agent: agentData || { agency_name: 'Unknown Agency' }
            };
          })
        );

        setAgentRequests(enrichedRequests);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch explore data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToShortlist = async (pitchId: string, playerId: string) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add players to your shortlist",
        variant: "destructive"
      });
      return;
    }

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
          player_id: playerId,
          pitch_id: pitchId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Player added to shortlist",
      });
    } catch (error) {
      console.error('Error adding to shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to add player to shortlist",
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Transfer Pitches Section */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="text-white font-polysans">
            Latest Transfer Pitches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transferPitches.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                No Active Pitches
              </h3>
              <p className="text-gray-400 font-poppins">
                Check back later for new transfer opportunities.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transferPitches.map((pitch) => (
                <Card key={pitch.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Player Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                          {pitch.player.headshot_url || pitch.player.photo_url ? (
                            <img
                              src={pitch.player.headshot_url || pitch.player.photo_url}
                              alt={pitch.player.full_name}
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
                            {pitch.player.full_name}
                          </h3>
                          <p className="text-gray-300 font-poppins text-xs">
                            {pitch.player.position}
                          </p>
                        </div>
                        <Button
                          onClick={() => addToShortlist(pitch.id, pitch.player.id)}
                          size="sm"
                          variant="ghost"
                          className="text-bright-pink hover:text-bright-pink/80"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Team Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span>{pitch.team.team_name}, {pitch.team.country}</span>
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
                          <div className="flex items-center gap-1 text-bright-pink font-bold">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(pitch.asking_price, pitch.currency)}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{pitch.view_count || 0} views</span>
                        <span>{pitch.message_count || 0} messages</span>
                        <span>{pitch.shortlist_count || 0} shortlisted</span>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Requests Section */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="text-white font-polysans">
            Agent Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentRequests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                No Active Requests
              </h3>
              <p className="text-gray-400 font-poppins">
                Check back later for new agent requests.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agentRequests.map((request) => (
                <Card key={request.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-polysans font-bold text-white text-sm">
                          {request.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {request.sport_type}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-300 text-xs line-clamp-2">
                        {request.description}
                      </p>
                      
                      {request.position && (
                        <div className="text-xs text-gray-400">
                          Position: {request.position}
                        </div>
                      )}
                      
                      {(request.budget_min || request.budget_max) && (
                        <div className="text-xs text-bright-pink">
                          Budget: {request.budget_min ? formatCurrency(request.budget_min, request.currency) : '0'} 
                          {request.budget_max ? ` - ${formatCurrency(request.budget_max, request.currency)}` : '+'}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{request.agent.agency_name}</span>
                        <span>{formatDaysLeft(request.expires_at)}</span>
                      </div>
                      
                      <Button size="sm" className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white text-xs">
                        Respond to Request
                      </Button>
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

export default ExploreHub;
