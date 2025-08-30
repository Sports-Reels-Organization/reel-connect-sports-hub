
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  video_type: 'match' | 'training' | 'interview' | 'highlight';
  description?: string;
  tags: string[];
  ai_analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
  opposing_team?: string;
  match_date?: string;
  score?: string;
  league_competition?: string;
  file_size?: number;
  compressed_url?: string;
}

const VideoAnalysisResults = () => {
  const { videoTitle } = useParams<{ videoTitle: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string>('');

  useEffect(() => {
    fetchCurrentTeam();
  }, []);

  useEffect(() => {
    if (videoTitle && currentTeamId) {
      fetchVideoData();
    }
  }, [videoTitle, currentTeamId]);

  const fetchCurrentTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamData) {
        setCurrentTeamId(teamData.id);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchVideoData = async () => {
    if (!videoTitle || !currentTeamId) return;

    try {
      setIsLoading(true);
      const decodedTitle = decodeURIComponent(videoTitle);

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('title', decodedTitle)
        .eq('team_id', currentTeamId)
        .single();

      if (error) throw error;

      if (data) {
        const mappedVideo: Video = {
          id: data.id,
          title: data.title,
          video_url: data.video_url,
          thumbnail_url: data.thumbnail_url,
          duration: data.duration,
          video_type: data.video_type as 'match' | 'training' | 'interview' | 'highlight',
          description: data.description,
          tags: Array.isArray(data.tagged_players) 
            ? data.tagged_players.map((tag: any) => String(tag)) 
            : [],
          ai_analysis_status: (data.ai_analysis_status === 'pending' || 
                             data.ai_analysis_status === 'analyzing' || 
                             data.ai_analysis_status === 'completed' || 
                             data.ai_analysis_status === 'failed') 
                             ? data.ai_analysis_status 
                             : 'pending',
          created_at: data.created_at,
          opposing_team: data.opposing_team,
          match_date: data.match_date,
          score: data.score_display || undefined,
          league_competition: data.league || undefined,
          file_size: data.file_size,
          compressed_url: data.compressed_url
        };
        setVideo(mappedVideo);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast({
        title: "Error",
        description: "Failed to load video data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeVideo = () => {
    toast({
      title: "AI Analysis",
      description: "AI video analysis feature is coming soon!",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bright-pink mx-auto mb-4"></div>
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Video Not Found</h2>
          <p className="text-gray-400 mb-6">The video you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => navigate('/videos')}
            className="bg-bright-pink hover:bg-bright-pink/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Videos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/videos')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Videos
          </Button>
          <h1 className="text-2xl font-polysans text-white">{video.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black">
                  <video
                    src={video.compressed_url || video.video_url}
                    poster={video.thumbnail_url}
                    controls
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                {/* Video Controls Info */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Duration: {formatDuration(video.duration)}</span>
                      <span>•</span>
                      <span className="capitalize">{video.video_type}</span>
                      {video.file_size && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(video.file_size)}</span>
                        </>
                      )}
                    </div>
                    <Badge className={`
                      ${video.ai_analysis_status === 'completed' ? 'bg-green-900/20 text-green-400' :
                        video.ai_analysis_status === 'analyzing' ? 'bg-blue-900/20 text-blue-400' :
                        video.ai_analysis_status === 'failed' ? 'bg-red-900/20 text-red-400' :
                        'bg-gray-900/20 text-gray-400'} border-0
                    `}>
                      {video.ai_analysis_status}
                    </Badge>
                  </div>
                  
                  {/* AI Analysis Button */}
                  <div className="mt-4">
                    <Button
                      onClick={handleAnalyzeVideo}
                      className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white"
                      size="lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Analyze Video with AI
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Information Sidebar */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Video Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-300 mb-1">Title</h4>
                  <p className="text-white">{video.title}</p>
                </div>
                
                {video.description && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Description</h4>
                    <p className="text-gray-400 text-sm">{video.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-300 mb-1">Upload Date</h4>
                  <p className="text-gray-400">{formatDate(video.created_at)}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-1">Type</h4>
                  <Badge variant="outline" className="border-gray-600 text-gray-300 capitalize">
                    {video.video_type}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Match Details (if applicable) */}
            {video.video_type === 'match' && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Match Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {video.opposing_team && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-1">Opposing Team</h4>
                      <p className="text-white">{video.opposing_team}</p>
                    </div>
                  )}
                  
                  {video.match_date && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-1">Match Date</h4>
                      <p className="text-gray-400">{formatDate(video.match_date)}</p>
                    </div>
                  )}
                  
                  {video.score && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-1">Score</h4>
                      <p className="text-white font-mono">{video.score}</p>
                    </div>
                  )}
                  
                  {video.league_competition && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-1">Competition</h4>
                      <p className="text-white">{video.league_competition}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tagged Players */}
            {video.tags.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Tagged Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className="bg-bright-pink/20 text-bright-pink border-bright-pink/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysisResults;
