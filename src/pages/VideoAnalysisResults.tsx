
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, Pause, RotateCcw, Zap, Eye, Calendar, Clock, Users, Video as VideoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

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
}

const VideoAnalysisResults = () => {
  const { videoTitle } = useParams<{ videoTitle: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (videoTitle) {
      fetchVideoByTitle(decodeURIComponent(videoTitle));
    }
  }, [videoTitle]);

  const fetchVideoByTitle = async (title: string) => {
    try {
      setIsLoading(true);
      
      // Get current user's profile to find their team
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view videos",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Get user's profile and team
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profile Not Found",
          description: "User profile not found",
          variant: "destructive"
        });
        return;
      }

      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!team) {
        toast({
          title: "Team Not Found",
          description: "No team associated with your account",
          variant: "destructive"
        });
        return;
      }

      // Fetch video by title for this team
      const { data: videoData, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', team.id)
        .eq('title', title)
        .single();

      if (error) {
        console.error('Error fetching video:', error);
        toast({
          title: "Video Not Found",
          description: "The requested video could not be found",
          variant: "destructive"
        });
        navigate(-1);
        return;
      }

      // Map the database video to our Video interface
      const mappedVideo: Video = {
        id: videoData.id,
        title: videoData.title,
        video_url: videoData.video_url,
        thumbnail_url: videoData.thumbnail_url,
        duration: videoData.duration,
        video_type: videoData.video_type as 'match' | 'training' | 'interview' | 'highlight',
        description: videoData.description,
        tags: Array.isArray(videoData.tagged_players) 
          ? videoData.tagged_players.map((tag: any) => String(tag)) 
          : [],
        ai_analysis_status: (videoData.ai_analysis_status === 'pending' || 
                           videoData.ai_analysis_status === 'analyzing' || 
                           videoData.ai_analysis_status === 'completed' || 
                           videoData.ai_analysis_status === 'failed') 
                           ? videoData.ai_analysis_status 
                           : 'pending',
        created_at: videoData.created_at,
        opposing_team: videoData.opposing_team,
        match_date: videoData.match_date,
        score: videoData.score_display || undefined,
        league_competition: videoData.competition || undefined
      };

      setVideo(mappedVideo);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load video",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAnalyzeVideo = () => {
    toast({
      title: "AI Analysis",
      description: "AI video analysis feature coming soon!",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bright-pink mx-auto mb-4"></div>
              <p className="text-gray-400">Loading video...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <p className="text-red-400 mb-4">Video not found</p>
            <Button onClick={handleBack} className="bg-rosegold text-black hover:bg-rosegold/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-white hover:text-rosegold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-polysans text-white">{video.title}</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                  <video
                    className="w-full h-full object-contain"
                    controls
                    poster={video.thumbnail_url}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  >
                    <source src={video.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <div className="p-4 bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(currentTime)} / {formatDuration(duration || video.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {video.video_type.charAt(0).toUpperCase() + video.video_type.slice(1)}
                      </span>
                    </div>
                    
                    <Button
                      onClick={handleAnalyzeVideo}
                      className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {video.description && (
              <Card className="bg-gray-800 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{video.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <VideoIcon className="w-5 h-5" />
                  Video Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white capitalize">{video.video_type}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white">{formatDuration(video.duration)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Uploaded</span>
                  <span className="text-white">{formatDate(video.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">AI Status</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    video.ai_analysis_status === 'completed' ? 'bg-green-900/20 text-green-400' :
                    video.ai_analysis_status === 'analyzing' ? 'bg-blue-900/20 text-blue-400' :
                    video.ai_analysis_status === 'failed' ? 'bg-red-900/20 text-red-400' :
                    'bg-gray-900/20 text-gray-400'
                  }`}>
                    {video.ai_analysis_status.charAt(0).toUpperCase() + video.ai_analysis_status.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {video.video_type === 'match' && (video.opposing_team || video.match_date || video.score || video.league_competition) && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Match Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {video.opposing_team && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Opponent</span>
                      <span className="text-white">{video.opposing_team}</span>
                    </div>
                  )}
                  
                  {video.match_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Match Date</span>
                      <span className="text-white">{formatDate(video.match_date)}</span>
                    </div>
                  )}
                  
                  {video.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Score</span>
                      <span className="text-white">{video.score}</span>
                    </div>
                  )}
                  
                  {video.league_competition && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Competition</span>
                      <span className="text-white">{video.league_competition}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {video.tags && video.tags.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Tagged Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-bright-pink/20 text-bright-pink px-2 py-1 rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Analysis Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleAnalyzeVideo}
                  className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze with AI
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Generate comprehensive AI analysis including player performance, tactical insights, and key moments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoAnalysisResults;
