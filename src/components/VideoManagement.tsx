
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { VideoAnalysisResults } from './VideoAnalysisResults';
import EnhancedVideoUploadForm from './EnhancedVideoUploadForm';
import {
  Play,
  Eye,
  Trash2,
  Search,
  Filter,
  Calendar,
  Users,
  BarChart3,
  Upload
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  opposing_team: string;
  match_date?: string;
  league?: string;
  home_or_away?: string;
  final_score?: string;
  duration?: number;
  file_size?: number;
  ai_analysis_status?: string;
  created_at: string;
  tagged_players?: string[];
}

const VideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [profile]);

  const fetchVideos = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamError) throw teamError;

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast({
        title: "Video Deleted",
        description: "The video has been successfully deleted"
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the video",
        variant: "destructive"
      });
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.opposing_team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Video Management</h1>
          <p className="text-gray-400">Upload, manage, and analyze your team videos</p>
        </div>
        <Button
          onClick={() => setShowUploadForm(true)}
          className="bg-rosegold hover:bg-rosegold/90"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="relative">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                  <Play className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <Badge 
                  variant={video.ai_analysis_status === 'completed' ? 'default' : 'secondary'}
                  className={video.ai_analysis_status === 'completed' ? 'bg-green-500' : ''}
                >
                  {video.ai_analysis_status || 'Pending'}
                </Badge>
              </div>

              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-white line-clamp-1">{video.title}</h3>
                  <p className="text-sm text-gray-400">vs {video.opposing_team}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {video.match_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(video.match_date).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {video.tagged_players?.length || 0} players
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analysis
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Video Analysis - {video.title}</DialogTitle>
                      </DialogHeader>
                      <VideoAnalysisResults 
                        videoId={video.id} 
                        teamId={profile?.id || ''} 
                        videoType="match"
                      />
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteVideo(video.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Play className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No Videos Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'No videos match your search criteria.' : 'Start by uploading your first video.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="bg-rosegold hover:bg-rosegold/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Form Modal */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Video</DialogTitle>
          </DialogHeader>
          <EnhancedVideoUploadForm />
        </DialogContent>
      </Dialog>

      {/* Video Viewer Modal */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedVideo.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <video
                src={selectedVideo.video_url}
                controls
                className="w-full rounded-lg"
                poster={selectedVideo.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Opponent:</span>
                  <p className="font-medium">{selectedVideo.opposing_team}</p>
                </div>
                {selectedVideo.match_date && (
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <p className="font-medium">
                      {new Date(selectedVideo.match_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Size:</span>
                  <p className="font-medium">{formatFileSize(selectedVideo.file_size)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <p className="font-medium">{formatDuration(selectedVideo.duration)}</p>
                </div>
              </div>

              {selectedVideo.description && (
                <div>
                  <span className="text-gray-400">Description:</span>
                  <p className="mt-1">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VideoManagement;
