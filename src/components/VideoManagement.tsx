
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  Plus,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Brain,
  FileText,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedVideoUploadForm from './EnhancedVideoUploadForm';
import VideoAnalysisResults from './VideoAnalysisResults';

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  video_type: string;
  ai_analysis_status: string;
  created_at: string;
  duration: number;
  opposing_team?: string;
  final_score?: string;
  league?: string;
}

const VideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'team') {
      loadTeamData();
    }
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      loadVideos();
    }
  }, [teamId]);

  useEffect(() => {
    applyFilters();
  }, [videos, searchTerm, filterType, filterStatus]);

  const loadTeamData = async () => {
    try {
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (error) throw error;
      setTeamId(teamData.id);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load team information",
        variant: "destructive"
      });
    }
  };

  const loadVideos = async () => {
    if (!teamId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface, handling missing properties
      const transformedVideos = (data || []).map(video => ({
        id: video.id,
        title: video.title,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url || '',
        video_type: video.video_type,
        ai_analysis_status: video.ai_analysis_status,
        created_at: video.created_at,
        duration: video.duration || 0,
        opposing_team: video.opposing_team || undefined,
        final_score: video.final_score_home && video.final_score_away 
          ? `${video.final_score_home}-${video.final_score_away}`
          : undefined,
        league: video.league || undefined,
      }));
      
      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = videos;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.opposing_team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.league?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(video => video.video_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(video => video.ai_analysis_status === filterStatus);
    }

    setFilteredVideos(filtered);
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Video Deleted",
        description: "Video has been successfully deleted",
      });

      loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Analyzed</Badge>;
      case 'analyzing':
        return <Badge className="bg-yellow-500 text-white">Analyzing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      match: 'bg-blue-500',
      training: 'bg-green-500',
      interview: 'bg-purple-500',
      highlight: 'bg-orange-500'
    };
    
    return (
      <Badge className={`${colors[type as keyof typeof colors]} text-white`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (profile?.user_type !== 'team') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Team Access Only</h3>
          <p className="text-gray-400">This feature is only available for team accounts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Video Management</h1>
          <p className="text-gray-400">Upload, analyze, and manage your team's video content</p>
        </div>

        <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
          <DialogTrigger asChild>
            <Button className="bg-bright-pink hover:bg-bright-pink/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Video</DialogTitle>
            </DialogHeader>
            {teamId && (
              <EnhancedVideoUploadForm
                teamId={teamId}
                onUploadComplete={() => {
                  setShowUploadForm(false);
                  loadVideos();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Video Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="match">Match</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Analysis Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Analyzed</SelectItem>
                <SelectItem value="analyzing">Analyzing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 animate-pulse">
              <div className="aspect-video bg-gray-700 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {videos.length === 0 ? 'No Videos Yet' : 'No Matching Videos'}
            </h3>
            <p className="text-gray-400 mb-6">
              {videos.length === 0 
                ? 'Upload your first video to get started with AI analysis'
                : 'Try adjusting your filters to see more videos'
              }
            </p>
            {videos.length === 0 && (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Video
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="bg-gray-800 border-gray-700 overflow-hidden hover:border-bright-pink/50 transition-colors">
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gray-900">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                
                {/* Duration overlay */}
                {video.duration > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                    {formatDuration(video.duration)}
                  </div>
                )}
                
                {/* Status overlay */}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(video.ai_analysis_status)}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium line-clamp-2 flex-1">
                    {video.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteVideo(video.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {getTypeBadge(video.video_type)}
                </div>

                {/* Match details */}
                {video.video_type === 'match' && video.opposing_team && (
                  <div className="text-sm text-gray-400 mb-2">
                    vs {video.opposing_team}
                    {video.final_score && (
                      <span className="ml-2 text-white">({video.final_score})</span>
                    )}
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(video.created_at).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {video.ai_analysis_status === 'completed' ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          View Analysis
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{video.title} - AI Analysis</DialogTitle>
                        </DialogHeader>
                        {teamId && (
                          <VideoAnalysisResults
                            videoId={video.id}
                            videoType={video.video_type as any}
                            teamId={teamId}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-400"
                      disabled
                    >
                      {video.ai_analysis_status === 'analyzing' ? (
                        <>
                          <div className="animate-spin w-3 h-3 mr-1 border border-current border-t-transparent rounded-full" />
                          Analyzing...
                        </>
                      ) : (
                        'Analysis Pending'
                      )}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:text-white"
                    onClick={() => window.open(video.video_url, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Video Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-bright-pink">
                {videos.length}
              </div>
              <div className="text-gray-400 text-sm">Total Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {videos.filter(v => v.ai_analysis_status === 'completed').length}
              </div>
              <div className="text-gray-400 text-sm">Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {videos.filter(v => v.ai_analysis_status === 'analyzing').length}
              </div>
              <div className="text-gray-400 text-sm">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {videos.filter(v => v.video_type === 'match').length}
              </div>
              <div className="text-gray-400 text-sm">Match Videos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManagement;
