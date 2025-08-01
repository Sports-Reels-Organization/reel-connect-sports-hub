
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, User, Calendar, Tag, Video as VideoIcon, Star, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PlayerProfileWrapper from './PlayerProfileWrapper';
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
  created_at?: string;
  team_id?: string;
  duration?: number;
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

      // Fetch all public videos with better filtering
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          teams!videos_team_id_fkey(
            id,
            team_name,
            country,
            logo_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      console.log('Fetched videos:', data);
      setVideos(data || []);
    } catch (error) {
      console.error('Error in fetchVideos:', error);
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
      // Find player by name with more flexible matching
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name')
        .ilike('full_name', `%${playerName.trim()}%`)
        .limit(1);

      if (error) {
        console.error('Error finding player:', error);
        return;
      }

      if (data && data.length > 0) {
        openPlayerProfile(data[0].id, data[0].full_name);
      } else {
        console.log('Player not found:', playerName);
      }
    } catch (error) {
      console.error('Error in handlePlayerTagClick:', error);
    }
  };

  const extractPlayerTags = (taggedPlayers: any): string[] => {
    if (!taggedPlayers) return [];

    try {
      if (Array.isArray(taggedPlayers)) {
        return taggedPlayers.map(player => {
          if (typeof player === 'string') return player;
          if (typeof player === 'object' && player.name) return player.name;
          if (typeof player === 'object' && player.full_name) return player.full_name;
          return 'Unknown Player';
        }).filter(Boolean);
      }

      if (typeof taggedPlayers === 'string') {
        try {
          const parsed = JSON.parse(taggedPlayers);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [taggedPlayers];
        }
      }
    } catch (error) {
      console.error('Error extracting player tags:', error);
    }

    return [];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white mb-2">
              Featured Videos
            </h1>
            <p className="text-gray-400 font-poppins">
              Loading player highlights with AI-powered analysis...
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="bg-[#1a1a1a] border-[#d4af37]/20 animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-[#111111] rounded-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="h-6 bg-[#111111] rounded"></div>
                  <div className="h-4 bg-[#111111] rounded w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-[#111111] rounded w-16"></div>
                    <div className="h-6 bg-[#111111] rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-[#d4af37]" />
              <span>{videos.length} videos available</span>
            </div>
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="bg-[#1a1a1a] border-[#d4af37]/20 hover:border-[#d4af37] transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-xl"
                onClick={() => handleVideoClick(video)}
              >
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative mb-4 overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-[#111111] to-[#1a1a1a] flex items-center justify-center">
                        <VideoIcon className="w-16 h-16 text-[#d4af37]/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <div className="absolute bottom-4 left-4 right-4">
                        {video.duration && (
                          <Badge className="bg-black/80 text-white text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-[#d4af37] rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-8 h-8 text-black" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Title */}
                    <h3 className="font-polysans font-semibold text-white text-lg line-clamp-2 group-hover:text-[#d4af37] transition-colors">
                      {video.title}
                    </h3>

                    {/* Description */}
                    {video.description && (
                      <p className="text-gray-400 text-sm line-clamp-2 font-poppins">
                        {video.description}
                      </p>
                    )}

                    {/* Match Info */}
                    <div className="space-y-2">
                      {video.match_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4 text-[#d4af37]" />
                          <span>{formatDate(video.match_date)}</span>
                          <span className="text-xs text-gray-500">
                            ({formatTimeAgo(video.created_at)})
                          </span>
                        </div>
                      )}

                      {video.opposing_team && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">vs {video.opposing_team}</span>
                          {video.score && (
                            <Badge className="bg-pink-500/20 border-pink-500/50 text-pink-400 hover:bg-pink-500/30">
                              {video.score}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tagged Players */}
                    {extractPlayerTags(video.tagged_players).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-white text-sm font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-[#d4af37]" />
                          Featured Players:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {extractPlayerTags(video.tagged_players).slice(0, 3).map((player, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-[#d4af37] hover:text-black transition-all duration-200 text-xs bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayerTagClick(player);
                              }}
                            >
                              {player}
                            </Badge>
                          ))}
                          {extractPlayerTags(video.tagged_players).length > 3 && (
                            <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
                              +{extractPlayerTags(video.tagged_players).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Video Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-white text-sm font-semibold flex items-center gap-2">
                          <Tag className="w-4 h-4 text-pink-400" />
                          Tags:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {video.tags.slice(0, 4).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-gray-400 border-gray-600 text-xs hover:border-pink-400 hover:text-pink-400 transition-colors"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-[#d4af37] to-pink-400 hover:from-[#d4af37]/90 hover:to-pink-400/90 text-black font-poppins font-semibold shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoClick(video);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch with AI Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-[#1a1a1a] border-[#d4af37]/20">
            <CardContent className="p-16 text-center">
              <VideoIcon className="w-20 h-20 mx-auto mb-6 text-[#d4af37]/50" />
              <h3 className="font-polysans text-2xl font-semibold text-white mb-3">
                No Videos Available
              </h3>
              <p className="text-gray-400 mb-6 font-poppins text-lg max-w-md mx-auto">
                No public videos are currently available for viewing. Check back later for new content.
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
      <PlayerProfileWrapper
        isOpen={isPlayerModalOpen}
        onClose={closePlayerProfile}
        playerId={selectedPlayerId || ''}
        playerName={selectedPlayerName || ''}
      />
    </>
  );
};

export default EnhancedVideoManagement;
