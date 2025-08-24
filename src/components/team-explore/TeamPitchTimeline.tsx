
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  Eye, 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  User, 
  Video,
  Calendar,
  DollarSign,
  TrendingUp,
  PlayCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TeamPitch {
  id: string;
  player_id: string;
  transfer_type: 'permanent' | 'loan';
  asking_price: number;
  loan_fee: number;
  status: string;
  expires_at: string;
  created_at: string;
  view_count: number;
  message_count: number;
  shortlist_count: number;
  description?: string;
  tagged_videos: string[];
  players: {
    full_name: string;
    position: string;
    citizenship: string;
    age: number;
    market_value: number;
    photo_url?: string;
  };
}

interface TeamPitchTimelineProps {
  onCreatePitch: () => void;
}

const TeamPitchTimeline: React.FC<TeamPitchTimelineProps> = ({ onCreatePitch }) => {
  const { profile } = useAuth();
  const [pitches, setPitches] = useState<TeamPitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamPitches();
  }, [profile]);

  const fetchTeamPitches = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data: pitchesData } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            full_name,
            position,
            citizenship,
            age,
            market_value,
            photo_url
          )
        `)
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false });

      setPitches(pitchesData || []);
    } catch (error) {
      console.error('Error fetching team pitches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    const isExpiringSoon = new Date(expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (status === 'expired') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (status === 'completed') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (isExpiringSoon) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  const getStatusText = (status: string, expiresAt: string) => {
    const isExpiringSoon = new Date(expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (status === 'expired') return 'Expired';
    if (status === 'completed') return 'Deal Completed';
    if (isExpiringSoon) return 'Expiring Soon';
    return 'Active';
  };

  const getDealStage = (pitch: TeamPitch) => {
    if (pitch.status === 'completed') return 'Agreement Reached';
    if (pitch.status === 'expired') return 'Expired';
    if (pitch.message_count > 5) return 'In Discussion';
    if (pitch.message_count > 0 || pitch.shortlist_count > 0) return 'Interest Shown';
    return 'Pitch Active';
  };

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'Agreement Reached': return 'text-green-400';
      case 'In Discussion': return 'text-blue-400';
      case 'Interest Shown': return 'text-yellow-400';
      case 'Expired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-polysans text-white">Your Transfer Pitches</h2>
          <p className="text-gray-400">Manage your active player pitches and track interest</p>
        </div>
        <Button 
          onClick={onCreatePitch}
          className="bg-rosegold text-black hover:bg-rosegold/90"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Create New Pitch
        </Button>
      </div>

      {/* Pitches List */}
      {pitches.length === 0 ? (
        <Card className="border-gray-700">
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-medium text-white mb-2">No Active Pitches</h3>
            <p className="text-gray-400 mb-6">
              Start promoting your players to attract agents and clubs worldwide.
            </p>
            <Button 
              onClick={onCreatePitch}
              className="bg-rosegold text-black hover:bg-rosegold/90"
            >
              Create Your First Pitch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pitches.map((pitch) => {
            const isExpiringSoon = new Date(pitch.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const dealStage = getDealStage(pitch);
            
            return (
              <Card key={pitch.id} className="border-gray-700 hover:border-rosegold/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Player Avatar */}
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={pitch.players.photo_url} alt={pitch.players.full_name} />
                      <AvatarFallback className="bg-gray-700 text-white">
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">{pitch.players.full_name}</h3>
                          <p className="text-gray-400 text-sm">
                            {pitch.players.position} • {pitch.players.citizenship} • Age {pitch.players.age}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(pitch.status, pitch.expires_at)}
                          >
                            {isExpiringSoon && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {getStatusText(pitch.status, pitch.expires_at)}
                          </Badge>
                        </div>
                      </div>

                      {/* Transfer Details */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-white">
                            {pitch.transfer_type === 'permanent' 
                              ? `$${pitch.asking_price?.toLocaleString()}` 
                              : `$${pitch.loan_fee?.toLocaleString()} loan`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">Market Value:</span>
                          <span className="text-white">${pitch.players.market_value?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Deal Progress */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Deal Stage:</span>
                        <span className={`text-sm font-medium ${getDealStageColor(dealStage)}`}>
                          {dealStage}
                        </span>
                      </div>

                      {/* Engagement Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{pitch.view_count}</span>
                          <span className="text-gray-500">views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{pitch.message_count}</span>
                          <span className="text-gray-500">messages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{pitch.shortlist_count}</span>
                          <span className="text-gray-500">shortlisted</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{pitch.tagged_videos?.length || 0}</span>
                          <span className="text-gray-500">videos</span>
                        </div>
                      </div>

                      {/* Time and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Posted {formatDistanceToNow(new Date(pitch.created_at))} ago
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Expires {formatDistanceToNow(new Date(pitch.expires_at))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Messages
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                            <PlayCircle className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPitchTimeline;
