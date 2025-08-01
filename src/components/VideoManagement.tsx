
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Upload, Plus, Video, User, Calendar, Tag, Trophy, Target } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import PlayerDetailModal from './PlayerDetailModal';
import VideoUploadForm from './VideoUploadForm';
import { VideoModal } from './VideoModal';

type DatabaseVideo = Tables<'videos'>;
type DatabasePlayer = Tables<'players'>;

interface League {
  id: string;
  name: string;
  country: string;
}

const VideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<DatabasePlayer | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<DatabaseVideo | null>(null);

  useEffect(() => {
    fetchTeamId();
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      fetchVideos();
      fetchPlayers();
      fetchLeagues();
    }
  }, [teamId]);

  const fetchTeamId = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        return;
      }

      if (data) {
        setTeamId(data.id);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchVideos = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchPlayers = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('full_name');

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('id, name, country')
        .order('name');

      if (error) {
        console.error('Error fetching leagues:', error);
        return;
      }

      setLeagues(data || []);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const handlePlayerTag = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setSelectedPlayer(player);
    }
  };

  const getTaggedPlayerNames = (video: DatabaseVideo) => {
    const taggedPlayersData = video.tagged_players;
    if (!taggedPlayersData || !Array.isArray(taggedPlayersData)) return [];

    return (taggedPlayersData as string[])
      .map((playerId: string) => {
        const player = players.find(p => p.id === playerId);
        return player ? { id: playerId, name: player.full_name } : null;
      })
      .filter(Boolean);
  };

  const getLeagueName = (leagueId?: string) => {
    if (!leagueId) return null;
    const league = leagues.find(l => l.id === leagueId);
    return league ? `${league.name} (${league.country})` : null;
  };

  const formatScore = (video: DatabaseVideo) => {
    if (video.final_score_home !== null && video.final_score_away !== null) {
      return `${video.final_score_home} - ${video.final_score_away}`;
    }
    return video.score || null;
  };

  if (profile?.user_type !== 'team') {
    return null;
  }

  return (
    <div className="p-[3rem] space-y-6 max-w-7xl mx-auto bg-[#111111] min-h-screen">
      <div className="flex items-center justify-between">
        <div className='text-start'>
          <h1 className="font-polysans text-3xl font-bold text-white mb-2">
            Video Management
          </h1>
          <p className="text-gray-400 font-poppins">
            Upload and manage match videos with AI analysis and detailed statistics
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(true)}
          className="bg-rosegold hover:bg-rosegold/90 text-black font-polysans border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <VideoUploadForm
            onUploadComplete={() => {
              fetchVideos();
              setShowUploadForm(false);
            }}
            onClose={() => setShowUploadForm(false)}
          />
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="bg-[#1a1a1a] border-rosegold/20 hover:border-rosegold/50 transition-colors group">
            <CardContent className="p-0">
              <div className="relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-700 rounded-t-lg flex items-center justify-center">
                    <Video className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                  <Button
                    size="lg"
                    onClick={() => setSelectedVideo(video)}
                    className="bg-rosegold/90 hover:bg-rosegold text-black"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Watch & Analyze
                  </Button>
                </div>

                {/* Upload Status Badge */}
                {video.upload_status !== 'completed' && (
                  <Badge 
                    className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  >
                    {video.upload_status}
                  </Badge>
                )}

                {/* AI Analysis Status */}
                {video.ai_analysis_status && (
                  <Badge 
                    className={`absolute top-2 left-2 ${
                      video.ai_analysis_status === 'completed' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : video.ai_analysis_status === 'analyzing'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}
                  >
                    AI {video.ai_analysis_status}
                  </Badge>
                )}
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-polysans font-semibold text-white text-lg mb-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 font-poppins">
                      {video.description}
                    </p>
                  )}
                </div>

                {/* Match Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {video.home_or_away && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            video.home_or_away === 'home' 
                              ? 'text-green-400 border-green-400' 
                              : 'text-blue-400 border-blue-400'
                          }`}
                        >
                          {video.home_or_away.toUpperCase()}
                        </Badge>
                      )}
                      {video.video_type && (
                        <Badge variant="outline" className="text-rosegold border-rosegold text-xs">
                          {video.video_type.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    {video.match_date && (
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(video.match_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {video.opposing_team && (
                    <div className="text-sm text-gray-300">
                      <span className="text-gray-500">vs</span> {video.opposing_team}
                      {formatScore(video) && (
                        <span className="ml-2 font-semibold text-rosegold">
                          ({formatScore(video)})
                        </span>
                      )}
                    </div>
                  )}

                  {getLeagueName(video.league_id) && (
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Trophy className="w-3 h-3" />
                      {getLeagueName(video.league_id)}
                    </div>
                  )}
                </div>

                {/* Tagged Players */}
                {getTaggedPlayerNames(video).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <User className="w-3 h-3" />
                      <span>Tagged Players</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getTaggedPlayerNames(video).map((player: any) => (
                        <Badge
                          key={player.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-bright-pink hover:text-white border-0 text-xs"
                          onClick={() => handlePlayerTag(player.id)}
                        >
                          {player.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Tag className="w-3 h-3" />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {video.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-gray-400 border-gray-600 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="pt-2 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {video.file_size ? `${(video.file_size / 1024 / 1024).toFixed(1)}MB` : 'Size unknown'}
                    </span>
                    <span>
                      {new Date(video.created_at!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && !showUploadForm && (
        <Card className="bg-[#1a1a1a] border-rosegold/20">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="font-polysans text-xl font-semibold text-white mb-2">
              No Videos Uploaded Yet
            </h3>
            <p className="text-gray-400 mb-6 font-poppins max-w-md mx-auto">
              Start showcasing your team by uploading match videos with detailed statistics and AI-powered analysis
            </p>
            <Button
              onClick={() => setShowUploadForm(true)}
              className="bg-rosegold hover:bg-rosegold/90 text-black font-polysans border-0"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Video
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onEdit={() => {
            setSelectedPlayer(null);
          }}
        />
      )}

      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          video={{
            ...selectedVideo,
            opposing_team: selectedVideo.opposing_team || '',
            score: formatScore(selectedVideo) || '',
            tagged_players: selectedVideo.tagged_players || [],
            description: selectedVideo.description || '',
            match_date: selectedVideo.match_date || '',
            team_id: selectedVideo.team_id || ''
          }}
          onPlayerTagClick={(playerName) => {
            const player = players.find(p => p.full_name === playerName);
            if (player) setSelectedPlayer(player);
          }}
        />
      )}
    </div>
  );
};

export default VideoManagement;
