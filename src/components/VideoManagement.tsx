
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import EnhancedVideoUploadForm from './EnhancedVideoUploadForm';
import VideoAnalysisResults from './VideoAnalysisResults';
import { 
  Play, 
  Upload, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  FileVideo,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  file_size: number;
  video_type: string;
  upload_status: string;
  ai_analysis_status: string;
  compression_status: string;
  created_at: string;
  match_date?: string;
  opposing_team?: string;
  final_score: string;
  tags?: string[];
}

interface VideoManagementProps {
  teamId: string;
}

const VideoManagement: React.FC<VideoManagementProps> = ({ teamId }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [teamId]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedVideos = (data || []).map(video => ({
        ...video,
        final_score: video.final_score?.toString() || '0'
      }));

      setVideos(processedVideos);
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
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== videoId));
      
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileVideo className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.opposing_team?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Card className="border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-polysans">
              Video Management ({videos.length})
            </CardTitle>
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {showUploadForm ? 'Hide Upload' : 'Upload Videos'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Upload Form */}
      {showUploadForm && (
        <EnhancedVideoUploadForm
          teamId={teamId}
          onUploadComplete={() => {
            fetchVideos();
            setShowUploadForm(false);
          }}
        />
      )}

      {/* Search and Filters */}
      <Card className="border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      <Card className="border-gray-700">
        <CardContent className="p-6">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                {searchTerm ? 'No Videos Found' : 'No Videos Uploaded'}
              </h3>
              <p className="text-gray-400 font-poppins mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start by uploading your first video'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowUploadForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Video Thumbnail */}
                      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative group">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileVideo className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                            onClick={() => window.open(video.video_url, '_blank')}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Duration Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div>
                        <h3 className="font-polysans font-bold text-white text-sm truncate">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>

                      {/* Video Details */}
                      <div className="space-y-2 text-xs text-gray-400">
                        <div className="flex items-center justify-between">
                          <span>Type: {video.video_type}</span>
                          <span>{formatFileSize(video.file_size)}</span>
                        </div>
                        
                        {video.opposing_team && (
                          <div>vs {video.opposing_team}</div>
                        )}
                        
                        {video.match_date && (
                          <div>{new Date(video.match_date).toLocaleDateString()}</div>
                        )}
                      </div>

                      {/* Status Indicators */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(video.upload_status)}
                          <span className="text-xs text-gray-400">Upload</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(video.ai_analysis_status)}
                          <span className="text-xs text-gray-400">Analysis</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(video.compression_status)}
                          <span className="text-xs text-gray-400">Compress</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {video.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {video.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{video.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowAnalysis(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Analysis
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-900/20"
                          onClick={() => deleteVideo(video.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Modal */}
      {showAnalysis && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-polysans font-bold text-white">
                  Video Analysis - {selectedVideo.title}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAnalysis(false);
                    setSelectedVideo(null);
                  }}
                >
                  ×
                </Button>
              </div>
              
              <VideoAnalysisResults videoId={selectedVideo.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;
