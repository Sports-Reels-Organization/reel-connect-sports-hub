import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Video,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Play,
  Eye,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  Upload,
  Tag,
  Download,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import VideoAnalysisResults from './VideoAnalysisResults';

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  video_type: string;
  duration?: number;
  file_size?: number;
  match_result?: string;
  performance_rating?: number;
  tags: string[];
  ai_analysis_status: string;
  created_at: string;
  opposing_team?: string;
  match_date?: string;
  score_display?: string;
}

const EnhancedVideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    result: '',
    rating: '',
    analysisStatus: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [profile, sortBy, filters]);

  const fetchVideos = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      // Get team ID
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      let query = supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamData.id);

      // Apply filters conditionally
      if (filters.type) {
        query = query.eq('video_type', filters.type);
      }
      if (filters.analysisStatus) {
        query = query.eq('ai_analysis_status', filters.analysisStatus);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'duration_long':
          query = query.order('duration', { ascending: false });
          break;
        case 'duration_short':
          query = query.order('duration', { ascending: true });
          break;
        case 'title_az':
          query = query.order('title', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map the data to ensure all required fields are present
      const mappedVideos: VideoData[] = (data || []).map(video => ({
        id: video.id,
        title: video.title,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        video_type: video.video_type,
        duration: video.duration,
        file_size: video.file_size,
        match_result: video.match_result || undefined,
        performance_rating: video.performance_rating || undefined,
        tags: Array.isArray(video.tagged_players) ? 
          video.tagged_players.map((tag: any) => typeof tag === 'string' ? tag : String(tag)) : 
          [],
        ai_analysis_status: video.ai_analysis_status,
        created_at: video.created_at,
        opposing_team: video.opposing_team,
        match_date: video.match_date,
        score_display: video.score_display
      }));

      setVideos(mappedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVideo = async (videoData: Partial<VideoData>) => {
    if (!selectedVideo) return;

    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: videoData.title,
          performance_rating: videoData.performance_rating,
          match_result: videoData.match_result
        })
        .eq('id', selectedVideo.id);

      if (error) throw error;

      toast({
        title: "Video Updated",
        description: "Video details have been updated successfully"
      });

      setIsEditDialogOpen(false);
      fetchVideos();
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update video",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Video Deleted",
        description: "Video has been deleted successfully"
      });

      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getAnalysisStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-400';
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.video_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.opposing_team && video.opposing_team.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-bright-pink/20 rounded-lg">
                  <Video className="w-6 h-6 text-bright-pink" />
                </div>
                Video Management
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Manage, analyze, and organize your video content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-bright-pink text-bright-pink hover:bg-bright-pink hover:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="text-gray-300"
              >
                {viewMode === 'grid' ? <BarChart3 className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 p-1">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            All Videos ({videos.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags & Labels
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search videos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="duration_long">Longest Duration</SelectItem>
                    <SelectItem value="duration_short">Shortest Duration</SelectItem>
                    <SelectItem value="title_az">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Video Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="highlight">Highlight</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.result} onValueChange={(value) => setFilters({ ...filters, result: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Match Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Results</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.analysisStatus} onValueChange={(value) => setFilters({ ...filters, analysisStatus: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Analysis Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  type="date"
                  placeholder="From Date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button
                onClick={() => setFilters({ type: '', result: '', rating: '', analysisStatus: '', dateFrom: '', dateTo: '' })}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 mt-4"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>

          {/* Video List */}
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-bright-pink border-t-transparent rounded-full" />
              </div>
            ) : filteredVideos.length === 0 ? (
              <Card className="col-span-full bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No Videos Found</h3>
                  <p className="text-gray-400">Upload your first video or adjust your search filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredVideos.map((video) => (
                <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-colors">
                  <div className="relative">
                    {video.thumbnail_url && (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getAnalysisStatusColor(video.ai_analysis_status)} text-white text-xs`}>
                        {video.ai_analysis_status}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{video.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Badge variant="outline" className="text-xs">
                            {video.video_type.toUpperCase()}
                          </Badge>
                          {video.performance_rating && (
                            <div className={`flex items-center gap-1 ${getRatingColor(video.performance_rating)}`}>
                              <Star className="w-3 h-3" />
                              <span className="text-xs font-medium">{video.performance_rating}/10</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {video.opposing_team && (
                        <div className="text-sm text-gray-300">
                          vs {video.opposing_team}
                          {video.match_result && (
                            <Badge className={`ml-2 text-xs ${
                              video.match_result === 'win' ? 'bg-green-500' :
                              video.match_result === 'loss' ? 'bg-red-500' : 'bg-yellow-500'
                            } text-white`}>
                              {video.match_result.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>Size: {formatFileSize(video.file_size)}</div>
                        <div>Date: {new Date(video.created_at).toLocaleDateString()}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
                          onClick={() => {
                            setSelectedVideo(video);
                            setIsAnalysisDialogOpen(true);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          View & Analyze
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => {
                            setSelectedVideo(video);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Video Analytics</h3>
              <p className="text-gray-400">Detailed analytics and insights about your video content</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Tags & Labels</h3>
              <p className="text-gray-400">Manage video tags and categorization</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Video Settings</h3>
              <p className="text-gray-400">Configure video management preferences</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Analysis Dialog */}
      {selectedVideo && (
        <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedVideo.title}</DialogTitle>
            </DialogHeader>
            <VideoAnalysisResults
              videoId={selectedVideo.id}
              videoType={selectedVideo.video_type as any}
              teamId="team-id"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Video Dialog */}
      {selectedVideo && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Video Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Video Title"
                defaultValue={selectedVideo.title}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select defaultValue={selectedVideo.match_result || ''}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Match Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Result</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Performance Rating (1-10)</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={selectedVideo.performance_rating}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpdateVideo(selectedVideo)}
                  className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedVideoManagement;
