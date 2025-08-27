
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Eye, Calendar, DollarSign, MapPin, Users, Search, Filter, Heart, HeartOff } from 'lucide-react';
import MessageModal from '../MessageModal';

interface TransferPitch {
  id: string;
  transfer_type: string;
  asking_price: number;
  currency: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  expires_at: string;
  created_at: string;
  view_count: number;
  message_count: number;
  description?: string;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    market_value: number;
  };
  teams: {
    id: string;
    team_name: string;
    country: string;
    profile_id: string;
  };
}

const AgentTransferTimeline: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState<TransferPitch | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortlistedPitches, setShortlistedPitches] = useState<Set<string>>(new Set());

  const fetchPitches = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players:players!inner(
            id,
            full_name,
            position,
            citizenship,
            market_value
          ),
          teams:teams!inner(
            id,
            team_name,
            country,
            profile_id
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPitches(data || []);
      
      // Fetch shortlisted pitches for this agent
      if (profile?.user_id) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', profile.user_id)
          .single();

        if (agentData) {
          const { data: shortlistData } = await supabase
            .from('agent_shortlist')
            .select('pitch_id')
            .eq('agent_id', agentData.id);

          if (shortlistData) {
            setShortlistedPitches(new Set(shortlistData.map(s => s.pitch_id)));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching pitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (pitch: TransferPitch) => {
    // Increment view count
    await supabase.rpc('increment_pitch_view_count', { pitch_uuid: pitch.id });
    
    setSelectedPitch(pitch);
    setShowMessageModal(true);
  };

  const handleShortlistToggle = async (pitchId: string) => {
    if (!profile?.user_id) return;

    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.user_id)
        .single();

      if (!agentData) return;

      const isShortlisted = shortlistedPitches.has(pitchId);

      if (isShortlisted) {
        // Remove from shortlist
        await supabase
          .from('agent_shortlist')
          .delete()
          .eq('agent_id', agentData.id)
          .eq('pitch_id', pitchId);

        setShortlistedPitches(prev => {
          const newSet = new Set(prev);
          newSet.delete(pitchId);
          return newSet;
        });

        toast({
          title: "Removed from shortlist",
          description: "Player removed from your shortlist",
        });
      } else {
        // Add to shortlist
        const pitch = pitches.find(p => p.id === pitchId);
        if (pitch) {
          await supabase
            .from('agent_shortlist')
            .insert({
              agent_id: agentData.id,
              pitch_id: pitchId,
              player_id: pitch.players.id,
              priority_level: 'medium'
            });

          setShortlistedPitches(prev => new Set([...prev, pitchId]));

          toast({
            title: "Added to shortlist",
            description: "Player added to your shortlist",
          });
        }
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredPitches = pitches.filter(pitch => 
    pitch.players.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pitch.teams.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pitch.players.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchPitches();
  }, [profile]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-16 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-polysans font-bold text-white">
              Transfer Market
            </h2>
            <p className="text-gray-400">Discover available players from teams worldwide</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players, teams, positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <Badge variant="outline" className="text-white border-white">
              {filteredPitches.length} Available
            </Badge>
          </div>
        </div>

        {filteredPitches.length === 0 ? (
          <Card className="border-gray-700">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No matches found' : 'No Transfer Pitches'}
              </h3>
              <p className="text-gray-400">
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'No active transfer pitches available at the moment.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredPitches.map((pitch) => {
              const daysLeft = getDaysUntilExpiry(pitch.expires_at);
              const isShortlisted = shortlistedPitches.has(pitch.id);
              
              return (
                <Card key={pitch.id} className="border-gray-700 bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl text-white font-polysans">
                          {pitch.players.full_name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {pitch.players.position} • {pitch.players.citizenship}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Market Value: {formatCurrency(pitch.players.market_value, pitch.currency)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShortlistToggle(pitch.id)}
                          className={isShortlisted ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}
                        >
                          {isShortlisted ? <Heart className="w-4 h-4 fill-current" /> : <HeartOff className="w-4 h-4" />}
                        </Button>
                        
                        <Badge className="bg-green-600 text-white">
                          ACTIVE
                        </Badge>
                        {daysLeft <= 7 && (
                          <Badge variant="destructive">
                            {daysLeft} days left
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">Transfer Type</div>
                        <div className="text-white font-semibold capitalize">
                          {pitch.transfer_type.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">Asking Price</div>
                        <div className="text-rosegold font-bold text-lg">
                          {formatCurrency(pitch.asking_price, pitch.currency)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">Team</div>
                        <div className="text-white font-semibold">
                          {pitch.teams.team_name} ({pitch.teams.country})
                        </div>
                      </div>
                    </div>

                    {pitch.description && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">Description</div>
                        <div className="text-white text-sm">
                          {pitch.description}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {pitch.view_count} views
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {pitch.message_count} messages
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Posted {formatDate(pitch.created_at)}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleMessageClick(pitch)}
                        size="sm"
                        className="bg-rosegold hover:bg-rosegold/90"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedPitch && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedPitch(null);
          }}
          pitchId={selectedPitch.id}
          playerId={selectedPitch.players.id}
          teamId={selectedPitch.teams.id}
          receiverId={selectedPitch.teams.profile_id}
          currentUserId={profile?.user_id || ''}
          playerName={selectedPitch.players.full_name}
          teamName={selectedPitch.teams.team_name}
        />
      )}
    </>
  );
};

export default AgentTransferTimeline;
