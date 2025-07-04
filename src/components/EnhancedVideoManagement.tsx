
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, User, Calendar, Tag, Video as VideoIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PlayerProfileModal from './PlayerProfileModal';
import VideoModal from './VideoModal';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  match_date?: string;
  opposing_team?: string;
  score?: string;
  tagged_players?: any;
  tags?: string[];
  description?: string;
}

export const EnhancedVideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const {
    selectedPlayerId,
    selectedPlayerName,
    isModalOpen: isPlayerModalOpen,
    openPlayerProfile,
    closePlayerProfile
  } = usePlayerProfile();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: VideoData) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const handlePlayerTagClick = async (playerName: string) => {
    try {
      // Find player by name
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name')
        .ilike('full_name', `%${playerName}%`)
        .limit(1)
        .single();

      if (error || !data) {
        console.error('Player not found:', playerName);
        return;
      }

      openPlayerProfile(data.id, data.full_name);
    } catch (error) {
      console.error('Error finding player:', error);
    }
  };

  const extractPlayerTags = (taggedPlayers: any): string[] => {
    if (!taggedPlayers) return [];
    if (Array.isArray(taggedPlayers)) {
      return taggedPlayers.map(player => 
        typeof player === 'string' ? player : player.name || 'Unknown Player'
      );
    }
    return [];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="h-48 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white mb-2">
              Featured Videos
            </h1>
            <p className="text-gray-400 font-poppins">
              Watch player highlights with AI-powered analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="bg-[#1a1a1a] border-rosegold/20 hover:border-rosegold transition-colors group">
              <CardContent className="p-4">
                <div className="relative mb-4 cursor-pointer" onClick={() => handleVideoClick(video)}>
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-700 rounded-lg flex items-center justify-center">
                      <VideoIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-polysans font-semibold text-white text-lg line-clamp-2">
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 font-poppins">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    {video.match_date && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(video.match_date)}
                      </div>
                    )}
                    {video.opposing_team && video.score && (
                      <div className="text-bright-pink font-semibold">
                        vs {video.opposing_team} ({video.score})
                      </div>
                    )}
                  </div>

                  {/* Tagged Players */}
                  {extractPlayerTags(video.tagged_players).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white text-sm font-semibold">Featured Players:</p>
                      <div className="flex flex-wrap gap-1">
                        {extractPlayerTags(video.tagged_players).map((player, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-bright-pink hover:text-white transition-colors text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayerTagClick(player);
                            }}
                          >
                            <User className="w-3 h-3 mr-1" />
                            {player}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Tags */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white text-sm font-semibold">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {video.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-gray-400 border-gray-600 text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleVideoClick(video)}
                    className="w-full bg-rosegold hover:bg-rosegold/90 text-white font-poppins"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch with AI Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {videos.length === 0 && (
          <Card className="bg-[#1a1a1a] border-rosegold/20">
            <CardContent className="p-12 text-center">
              <VideoIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="font-polysans text-xl font-semibold text-white mb-2">
                No Videos Available
              </h3>
              <p className="text-gray-400 mb-6 font-poppins">
                No public videos are currently available for viewing.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => {
          setShowVideoModal(false);
          setSelectedVideo(null);
        }}
        video={selectedVideo}
        onPlayerTagClick={handlePlayerTagClick}
      />

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isPlayerModalOpen}
        onClose={closePlayerProfile}
        playerId={selectedPlayerId || ''}
        playerName={selectedPlayerName || ''}
      />
    </>
  );
};

export default EnhancedVideoManagement;
