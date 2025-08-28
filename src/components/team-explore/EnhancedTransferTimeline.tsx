import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, MapPin, Users, MessageCircle, Clock, DollarSign, Filter, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageModal } from '@/components/MessageModal';
import { useAuth } from '@/contexts/AuthContext';

interface TransferPitch {
    player_id: any;
    id: string;
    description: string;
    asking_price: number;
    currency: string;
    transfer_type: string;
    status: string;
    created_at: string;
    expires_at: string;
    tagged_videos: string[];
    sign_on_bonus: number;
    performance_bonus: number;
    player_salary: number;
    relocation_support: number;
    loan_fee: number;
    loan_with_option: boolean;
    loan_with_obligation: boolean;
    is_international: boolean;
    service_charge_rate: number;
    team_id: string;
    team_profile_id?: string; // Added for messaging
    players: {
        id: string;
        full_name: string;
        position: string;
        citizenship: string;
        headshot_url: string;
        photo_url: string;
        jersey_number: number;
        age?: number;
        bio: string;
        market_value: number;
        height: number;
        weight: number;
    };
    teams: {
        team_name: string;
        country: string;
        logo_url: string;
        member_association: string;
    };
    tagged_video_details?: {
        id: string;
        title: string;
        thumbnail_url: string;
        duration: number;
    }[];
    message_count?: number;
    view_count?: number;
}

interface EnhancedTransferTimelineProps {
  userType: 'agent' | 'team';
}

const EnhancedTransferTimeline: React.FC<EnhancedTransferTimelineProps> = ({ userType }) => {
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState<TransferPitch | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchPitches = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transfer_pitches')
        .select(`
          *,
          teams!inner(*),
          players!inner(*),
          messages(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (userType === 'team' && profile?.team_profile?.id) {
        query = query.eq('team_id', profile.team_profile.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transfer pitches:', error);
        toast({
          title: "Error",
          description: "Failed to load transfer opportunities",
          variant: "destructive"
        });
        return;
      }

      const enrichedPitches = data?.map(pitch => ({
        ...pitch,
        message_count: pitch.messages ? pitch.messages[0]?.count : 0,
        view_count: Math.floor(Math.random() * 50) // Mock view count
      })) || [];

      setPitches(enrichedPitches);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while loading data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (pitch: TransferPitch) => {
    console.log('Opening message modal for pitch:', pitch.id);
    setSelectedPitch(pitch);
    setMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setSelectedPitch(null);
    setMessageModalOpen(false);
  };

  useEffect(() => {
    fetchPitches();
  }, [userType, profile?.team_profile?.id]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getReceiverId = (pitch: TransferPitch) => {
    if (userType === 'agent') {
      return pitch.team_profile_id || pitch.team_id;
    } else {
      // For teams, we need to get the agent's profile ID
      // This should be handled in the MessageModal component
      return pitch.team_id; // Placeholder
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rosegold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-polysans font-bold text-white">
            {userType === 'agent' ? 'Available Transfer Opportunities' : 'Your Transfer Pitches'}
          </h2>
          <p className="text-gray-400 font-poppins">
            {userType === 'agent' 
              ? 'Explore and connect with teams looking for players'
              : 'Manage your player transfer listings and track interest'
            }
          </p>
        </div>
        <Button size="sm" variant="outline" className="border-gray-600">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {pitches.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-polysans text-white mb-2">
              {userType === 'agent' ? 'No Transfer Opportunities' : 'No Transfer Pitches'}
            </h3>
            <p className="text-gray-400">
              {userType === 'agent' 
                ? 'Check back later for new transfer opportunities from teams.'
                : 'Start by creating your first transfer pitch to showcase your players.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pitches.map((pitch) => (
            <Card key={pitch.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage 
                        src={pitch.players?.photo_url || pitch.players?.headshot_url} 
                        alt={pitch.players?.full_name}
                      />
                      <AvatarFallback className="bg-rosegold text-white text-lg font-polysans">
                        {pitch.players?.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white font-polysans text-xl">
                        {pitch.players?.full_name || 'Unknown Player'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                        <span>{pitch.players?.position}</span>
                        <span>•</span>
                        <span>{pitch.players?.citizenship}</span>
                        {pitch.players?.age && (
                          <>
                            <span>•</span>
                            <span>{pitch.players.age} years</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">
                          {pitch.teams?.team_name} • {pitch.teams?.country}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={pitch.status === 'active' ? 'default' : 'secondary'}
                      className={`${
                        pitch.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {pitch.status}
                    </Badge>
                    <Badge variant="outline" className="border-rosegold/30 text-rosegold">
                      {pitch.transfer_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-300 font-poppins leading-relaxed">
                  {pitch.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-rosegold" />
                    <span className="text-white font-semibold">
                      {formatCurrency(pitch.asking_price, pitch.currency)}
                    </span>
                  </div>
                  
                  {pitch.player_salary > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Salary:</span>
                      <span className="text-white">
                        {formatCurrency(pitch.player_salary, pitch.currency)}/month
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">
                      Expires {new Date(pitch.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {(pitch.sign_on_bonus > 0 || pitch.performance_bonus > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                    {pitch.sign_on_bonus > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-400">Sign-on Bonus:</span>
                        <span className="text-white ml-2">
                          {formatCurrency(pitch.sign_on_bonus, pitch.currency)}
                        </span>
                      </div>
                    )}
                    {pitch.performance_bonus > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-400">Performance Bonus:</span>
                        <span className="text-white ml-2">
                          {formatCurrency(pitch.performance_bonus, pitch.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {pitch.message_count || 0} messages
                    </span>
                    <span>{pitch.view_count || 0} views</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMessageClick(pitch)}
                      size="sm"
                      className="bg-rosegold hover:bg-rosegold/90 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {userType === 'agent' ? 'Express Interest' : 'View Messages'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Modal with Contract Generation */}
      {selectedPitch && (
        <MessageModal
          isOpen={messageModalOpen}
          onClose={closeMessageModal}
          pitchId={selectedPitch.id}
          playerId={selectedPitch.player_id}
          teamId={selectedPitch.team_id}
          receiverId={getReceiverId(selectedPitch)}
          currentUserId={profile?.id || ''}
          playerName={selectedPitch.players?.full_name || 'Unknown Player'}
          teamName={selectedPitch.teams?.team_name}
        />
      )}
    </div>
  );
};

export default EnhancedTransferTimeline;
