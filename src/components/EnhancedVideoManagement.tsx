import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVideoUpload from './EnhancedVideoUpload';
import VideoAnalysisResults from './VideoAnalysisResults';
import {
  Play,
  Upload,
  Brain,
  Download,
  Search,
  Filter,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  video_type: string;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
  ai_analysis_status: string;
  tagged_players: string[];
  file_size: number;
  duration: number;
}

const EnhancedVideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);

  useEffect(() => {
    if (profile?.user_type === 'team') {
      fetchTeamData();
      fetchVideos();
    }
  }, [profile]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, selectedType]);

  const fetchTeamData = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();

      if (error) throw error;
      setTeamData(data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!teamData) return;

      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          video_type,
          video_url,
          thumbnail_url,
          created_at,
          ai_analysis_status,
          tagged_players,
          file_size,
          duration,
          enhanced_video_analysis(*)
        `)
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Video interface with proper type handling
      const transformedVideos = (data || []).map(video => ({
        ...video,
        tagged_players: Array.isArray(video.tagged_players) 
          ? video.tagged_players.filter(p => typeof p === 'string') as string[]
          : video.tagged_players && typeof video.tagged_players === 'string'
            ? [video.tagged_players as string] 
            : []
      }));
      
      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(video => video.video_type === selectedType);
    }

    setFilteredVideos(filtered);
  };

  const handleVideoUploaded = (videoData: any) => {
    setVideos(prev => [videoData, ...prev]);
    setShowUpload(false);
    toast({
      title: "Video Uploaded",
      description: "Video uploaded successfully and ready for analysis",
    });
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast({
        title: "Video Deleted",
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

  const downloadAnalysisReport = async (video: Video) => {
    try {
      const { data: reports } = await supabase
        .from('ai_analysis_reports')
        .select('pdf_url')
        .eq('video_id', video.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (reports && reports.length > 0) {
        const link = document.createElement('a');
        link.href = reports[0].pdf_url;
        link.download = `${video.title}_Analysis_Report.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Report Downloaded",
          description: "Analysis report downloaded successfully",
        });
      } else {
        toast({
          title: "No Report Available",
          description: "Analysis report is not yet available for this video",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download analysis report",
        variant: "destructive"
      });
    }
  };

  const getAnalysisStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (profile?.user_type !== 'team') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Video management is only available for team accounts.</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedVideo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedVideo(null)}
            className="border-gray-600 text-gray-300"
          >
            ← Back to Videos
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedVideo.title}</h2>
            <p className="text-gray-400">
              {selectedVideo.video_type.charAt(0).toUpperCase() + selectedVideo.video_type.slice(1)} • 
              {new Date(selectedVideo.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <VideoAnalysisResults
          videoId={selectedVideo.id}
          videoType={selectedVideo.video_type as any}
          teamId={teamData?.id}
        />
      </div>
    );
  }

  if (showUpload) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowUpload(false)}
            className="border-gray-600 text-gray-300"
          >
            ← Back to Videos
          </Button>
          <h2 className="text-2xl font-bold text-white">Upload New Video</h2>
        </div>
        
        <EnhancedVideoUpload
          teamId={teamData?.id}
          onVideoUploaded={handleVideoUploaded}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Video Management</h1>
          <p className="text-gray-400 mt-1">
            Upload, analyze, and manage your team's video content with AI insights
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-bright-pink hover:bg-bright-pink/90 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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
            
            <div className="flex gap-2">
              {['all', 'match', 'training', 'interview', 'highlight'].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className={selectedType === type ? 'bg-bright-pink' : 'border-gray-600 text-gray-300'}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
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
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Videos Found</h3>
            <p className="text-gray-400 mb-6">
              {videos.length === 0 
                ? "Upload your first video to get started with AI analysis" 
                : "No videos match your current filters"}
            </p>
            {videos.length === 0 && (
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Video
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-all">
              <div className="relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="aspect-video object-cover rounded-t-lg w-full"
                  />
                ) : (
                  <div className="aspect-video bg-gray-700 rounded-t-lg flex items-center justify-center">
                    <Play className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                
                <div className="absolute top-3 left-3">
                  <Badge className="bg-black/70 text-white">
                    {video.video_type.charAt(0).toUpperCase() + video.video_type.slice(1)}
                  </Badge>
                </div>
                
                <div className="absolute top-3 right-3">
                  {getAnalysisStatusBadge(video.ai_analysis_status)}
                </div>

                {video.duration && (
                  <div className="absolute bottom-3 right-3">
                    <Badge className="bg-black/70 text-white">
                      {formatDuration(video.duration)}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-2 line-clamp-2">{video.title}</h3>
                
                {video.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  {new Date(video.created_at).toLocaleDateString()}
                  <span>•</span>
                  {formatFileSize(video.file_size)}
                  {video.tagged_players && video.tagged_players.length > 0 && (
                    <>
                      <span>•</span>
                      <Users className="w-3 h-3" />
                      {video.tagged_players.length} tagged
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedVideo(video)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-bright-pink hover:border-bright-pink hover:text-white"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Analysis
                  </Button>
                  
                  {video.ai_analysis_status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAnalysisReport(video)}
                      className="border-gray-600 text-gray-300 hover:bg-green-600 hover:border-green-600"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="border-gray-600 text-gray-300 hover:bg-red-600 hover:border-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoManagement;
