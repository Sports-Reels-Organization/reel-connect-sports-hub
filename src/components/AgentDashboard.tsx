import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, MapPin, Plus } from 'lucide-react';
import { MessageModal } from '@/components/MessageModal';

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
  player_name?: string;
  player_position?: string;
  player_citizenship?: string;
  team_name?: string;
  team_country?: string;
  member_association?: string;
}

const AgentDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<TransferPitch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
        .limit(20);

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
          team_name: teamData?.team_name,
          team_country: teamData?.country,
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
        team_profile_id: teamData.profile_id,
        team_name: teamData.team_name
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

  const filteredPitches = pitches.filter(pitch => {
    const matchesSearch = pitch.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pitch.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pitch.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-6 bg-background min-h-screen p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white mb-2">
              Agent Dashboard
            </h1>
            <p className="text-gray-400 font-poppins">
              Discover players and manage your transfer activities
            </p>
          </div>
          <Button
            onClick={() => setShowMessageModal(true)}
            className="bg-bright-pink hover:bg-bright-pink/90 text-white font-polysans"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Request
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-gray-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPitches.length === 0 ? (
          <Card className="border-gray-700">
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                No Active Transfer Pitches
              </h3>
              <p className="text-gray-400 font-poppins">
                There are currently no active player transfer opportunities available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPitches.map((pitch) => (
              <Card key={pitch.id} className="border-gray-700 hover:border-rosegold/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700">
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-polysans font-bold text-white text-lg">
                          {pitch.player_name || 'Unknown Player'}
                        </h3>
                        <p className="text-gray-300 font-poppins text-sm">
                          {pitch.player_position || 'Unknown Position'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                            {pitch.transfer_type?.toUpperCase()}
                          </Badge>
                          {pitch.player_citizenship && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              {pitch.player_citizenship}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{pitch.team_name}, {pitch.team_country || 'Unknown'}</span>
                    </div>

                    {pitch.description && (
                      <p className="text-gray-300 font-poppins text-sm line-clamp-3">
                        {pitch.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      {pitch.transfer_type === 'permanent' && pitch.asking_price && (
                        <div className="flex items-center gap-2 text-lg font-bold text-bright-pink">
                          <DollarSign className="h-5 w-5" />
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: pitch.currency || 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(pitch.asking_price)}
                        </div>
                      )}
                      {pitch.transfer_type === 'loan' && pitch.loan_fee && (
                        <div className="flex items-center gap-2 text-lg font-bold text-bright-pink">
                          <DollarSign className="h-5 w-5" />
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: pitch.currency || 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(pitch.loan_fee)} (Loan)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(pitch.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {Math.ceil((new Date(pitch.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => handleMessageClick(pitch)}
                        size="sm"
                        className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message Team
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
