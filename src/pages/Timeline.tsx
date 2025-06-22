
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Heart, MessageSquare, Calendar, DollarSign, MapPin, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InfoTooltip from '@/components/InfoTooltip';

interface TransferPitch {
  id: string;
  player: {
    full_name: string;
    position: string;
    photo_url?: string;
    citizenship: string;
    market_value?: number;
  };
  team: {
    team_name: string;
    country: string;
    sport_type: string;
  };
  transfer_type: string;
  asking_price?: number;
  currency: string;
  description?: string;
  expires_at: string;
  created_at: string;
}

const Timeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: '',
    position: '',
    transfer_type: '',
    search: ''
  });

  useEffect(() => {
    fetchTransferPitches();
  }, [filters]);

  const fetchTransferPitches = async () => {
    try {
      let query = supabase
        .from('transfer_pitches')
        .select(`
          *,
          player:players(full_name, position, photo_url, citizenship, market_value),
          team:teams(team_name, country, sport_type)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (filters.sport) {
        query = query.eq('team.sport_type', filters.sport);
      }

      if (filters.transfer_type) {
        query = query.eq('transfer_type', filters.transfer_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      if (filters.position) {
        filteredData = filteredData.filter(pitch => 
          pitch.player.position.toLowerCase().includes(filters.position.toLowerCase())
        );
      }

      if (filters.search) {
        filteredData = filtere Data.filter(pitch =>
          pitch.player.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          pitch.team.team_name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setPitches(filteredData);
    } catch (error) {
      console.error('Error fetching transfer pitches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async (pitchId: string, playerId: string) => {
    if (profile?.user_type !== 'agent') {
      toast({
        title: "Access Denied",
        description: "Only agents can shortlist players",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get agent profile
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) throw new Error('Agent profile not found');

      const { error } = await supabase
        .from('shortlist')
        .insert({
          agent_id: agentData.id,
          player_id: playerId,
          pitch_id: pitchId
        });

      if (error) throw error;

      toast({
        title: "Added to Shortlist",
        description: "Player has been added to your shortlist",
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getExpiryText = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 0) return 'Expired';
    if (diffInDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffInDays} days`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Transfer Timeline
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-rosegold font-poppins">
              Discover talented players available for transfer
            </p>
            <InfoTooltip content="Teams pitch their players here. Agents can shortlist and message about potential transfers." />
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-rosegold/20">
          <CardHeader>
            <CardTitle className="font-polysans text-white">Filter Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Select value={filters.sport} onValueChange={(value) => setFilters({...filters, sport: value})}>
                  <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sports</SelectItem>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="volleyball">Volleyball</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="rugby">Rugby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Input
                  placeholder="Position (e.g. Striker)"
                  value={filters.position}
                  onChange={(e) => setFilters({...filters, position: e.target.value})}
                  className="bg-white/10 border-rosegold/30 text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <Select value={filters.transfer_type} onValueChange={(value) => setFilters({...filters, transfer_type: value})}>
                  <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                    <SelectValue placeholder="Transfer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  placeholder="Search players or teams"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="bg-white/10 border-rosegold/30 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Pitches */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/5 border-rosegold/20 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-64 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : pitches.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Trophy className="h-12 w-12 text-rosegold mx-auto mb-4" />
              <h3 className="text-xl font-polysans text-white mb-2">No Active Pitches</h3>
              <p className="text-gray-400 font-poppins">
                No players match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            pitches.map((pitch) => (
              <Card key={pitch.id} className="bg-white/5 border-rosegold/20 hover:border-rosegold/40 transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Player Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-rosegold/20 rounded-full flex items-center justify-center">
                        {pitch.player.photo_url ? (
                          <img 
                            src={pitch.player.photo_url} 
                            alt={pitch.player.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-rosegold font-polysans font-bold text-lg">
                            {pitch.player.full_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-polysans font-bold text-white text-lg">
                          {pitch.player.full_name}
                        </h3>
                        <p className="text-rosegold font-poppins">
                          {pitch.player.position}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {pitch.player.citizenship}
                        </div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Trophy className="h-4 w-4 text-rosegold" />
                      <span className="font-poppins">
                        {pitch.team.team_name} • {pitch.team.country}
                      </span>
                    </div>

                    {/* Transfer Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                          {pitch.transfer_type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-rosegold border-rosegold">
                          {pitch.team.sport_type.toUpperCase()}
                        </Badge>
                      </div>

                      {pitch.asking_price && (
                        <div className="flex items-center gap-2 text-lg font-polysans font-bold text-bright-pink">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(pitch.asking_price, pitch.currency)}
                        </div>
                      )}

                      {pitch.player.market_value && (
                        <div className="text-sm text-gray-400">
                          Market Value: {formatCurrency(pitch.player.market_value, 'USD')}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {pitch.description && (
                      <p className="text-sm text-gray-300 font-poppins line-clamp-2">
                        {pitch.description}
                      </p>
                    )}

                    {/* Timing */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeAgo(pitch.created_at)}
                      </div>
                      <span className="text-bright-pink">
                        {getExpiryText(pitch.expires_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {profile?.user_type === 'agent' && (
                        <Button
                          onClick={() => handleShortlist(pitch.id, pitch.player.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-rosegold text-rosegold hover:bg-rosegold hover:text-white font-poppins"
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Shortlist
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Timeline;
