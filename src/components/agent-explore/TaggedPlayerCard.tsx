import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  MapPin, 
  DollarSign, 
  MessageSquare, 
  Eye, 
  Play,
  Building2,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PlayerDetailModal from '@/components/PlayerDetailModal';
import MessageModal from '@/components/MessageModal';

interface PlayerData {
  id: string;
  full_name: string;
  position: string;
  citizenship: string;
  market_value: number;
  portrait_url?: string;
  team?: {
    id?: string;
    team_name: string;
    country: string;
  };
  pitch?: {
    id: string;
    asking_price: number;
    currency: string;
    transfer_type: string;
    expires_at: string;
    tagged_videos: any[];
  };
}

interface TaggedPlayerCardProps {
  playerId: string;
}

export const TaggedPlayerCard: React.FC<TaggedPlayerCardProps> = ({ playerId }) => {
  const { profile } = useAuth();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayerDetail, setShowPlayerDetail] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [canMessage, setCanMessage] = useState(false);

  useEffect(() => {
    fetchPlayerData();
    checkMessagingPermissions();
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      const { data: playerData, error } = await supabase
        .from('players')
        .select(`
          id,
          full_name,
          position,
          citizenship,
          market_value,
          portrait_url,
          team:teams(
            id,
            team_name,
            country
          )
        `)
        .eq('id', playerId)
        .single();

      if (error) throw error;

      const { data: pitchData } = await supabase
        .from('transfer_pitches')
        .select(`
          id,
          asking_price,
          currency,
          transfer_type,
          expires_at,
          tagged_videos
        `)
        .eq('player_id', playerId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Handle tagged_videos type conversion
      const processedPitch = pitchData ? {
        ...pitchData,
        tagged_videos: Array.isArray(pitchData.tagged_videos) 
          ? pitchData.tagged_videos 
          : pitchData.tagged_videos ? [pitchData.tagged_videos] : []
      } : undefined;

      setPlayer({
        ...playerData,
        pitch: processedPitch
      });
    } catch (error) {
      console.error('Error fetching player data:', error);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const checkMessagingPermissions = async () => {
    if (!profile || profile.user_type !== 'agent') {
      setCanMessage(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('agents')
        .select('fifa_id, specialization')
        .eq('profile_id', profile.id)
        .single();

      if (data?.specialization?.includes('football')) {
        setCanMessage(!!data.fifa_id);
      } else {
        setCanMessage(true);
      }
    } catch (error) {
      console.error('Error checking messaging permissions:', error);
      setCanMessage(false);
    }
  };

  const handleViewPlayer = () => {
    setShowPlayerDetail(true);
  };

  const handleMessage = () => {
    if (!canMessage) return;
    setShowMessageModal(true);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (!player) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          Player not found
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {player.portrait_url ? (
                <img
                  src={player.portrait_url}
                  alt={player.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {player.full_name}
              </h4>
              <p className="text-xs text-muted-foreground">{player.position}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{player.citizenship}</span>
            </div>
            
            {player.team && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="w-3 h-3" />
                <span>{player.team.team_name}, {player.team.country}</span>
              </div>
            )}
          </div>

          {player.pitch && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {player.pitch.transfer_type.replace('_', ' ').toUpperCase()}
                </Badge>
                
                {player.pitch.tagged_videos && player.pitch.tagged_videos.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Play className="w-3 h-3" />
                    {player.pitch.tagged_videos.length}
                  </div>
                )}
              </div>

              {player.pitch.asking_price && (
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  <DollarSign className="w-3 h-3" />
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: player.pitch.currency || 'USD',
                    minimumFractionDigits: 0
                  }).format(player.pitch.asking_price)}
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Expires {formatDistanceToNow(new Date(player.pitch.expires_at), { addSuffix: true })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleViewPlayer}
              className="flex-1 text-xs h-8"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            
            {profile?.user_type === 'agent' && (
              <Button 
                size="sm" 
                onClick={handleMessage}
                disabled={!canMessage}
                className="flex-1 text-xs h-8"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Message
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showPlayerDetail && player && (
        <PlayerDetailModal
          player={{
            id: player.id,
            full_name: player.full_name,
            position: player.position,
            citizenship: player.citizenship,
            market_value: player.market_value,
            portrait_url: player.portrait_url,
            age: 0,
            ai_analysis: {},
            bio: '',
            contract_expires: '',
            created_at: '',
            current_club: player.team?.team_name || '',
            date_of_birth: '',
            fifa_id: '',
            foot: '',
            height: 0,
            jersey_number: 0,
            join_date: '',
            league: '',
            nationality: player.citizenship,
            previous_clubs: [],
            profile_id: '',
            sports_type: 'football',
            stats: {},
            tagged_players: [],
            team_id: player.team?.id || '',
            updated_at: '',
            weight: 0
          }}
          isOpen={showPlayerDetail}
          onClose={() => setShowPlayerDetail(false)}
        />
      )}

      {showMessageModal && player && player.pitch && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          pitchId={player.pitch.id}
          playerId={player.id}
          teamId={player.team?.id || ''}
          playerName={player.full_name}
          teamName={player.team?.team_name || ''}
          currentUserId={profile?.id || ''}
        />
      )}
    </>
  );
};

export default TaggedPlayerCard;
