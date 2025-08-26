
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import VideoAnalysisResults from './VideoAnalysisResults';
import { 
  Play, 
  Upload, 
  Eye, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Trash2,
  BarChart3,
  Download,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  file_size: number;
  team_id: string;
  match_date: string;
  opposing_team: string;
  league: string;
  final_score: string;
  home_or_away: string;
  is_processed: boolean;
  ai_analysis_status: string;
  tagged_players: any;
  created_at: string;
  updated_at: string;
}

const VideoManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [profile]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, filterStatus, sortBy]);

  const fetchVideos = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedVideos: Video[] = (data || []).map(video => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url || '',
        duration: video.duration || 0,
        file_size: video.file_size || 0,
        team_id: video.team_id,
        match_date: video.match_date || '',
        opposing_team: video.opposing_team || '',
        league: video.league || '',
        final_score: String(video.final_score || ''), // Convert to string
        home_or_away: video.home_or_away || '',
        is_processed: video.is_processed || false,
        ai_analysis_status: video.ai_analysis_status || 'pending',
        tagged_players: video.tagged_players,
        created_at: video.created_at,
        updated_at: video.updated_at
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
    let filtered = [...videos];

    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.opposing_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.league.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(video => video.ai_analysis_status === filterStatus);
    }

    // Apply sorting
    switch (sortBy) {
      case 'title_asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration_desc':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
      case 'match_date_desc':
        filtered.sort((a, b) => new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime());
        break;
      default: // created_at_desc
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredVideos(filtered);
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
        description: "Video deleted successfully"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Video Management ({filteredVideos.length})
            </CardTitle>
            
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search videos, teams, leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Analysis Complete</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Recently Uploaded</SelectItem>
                <SelectItem value="match_date_desc">Recent Matches</SelectItem>
                <SelectItem value="duration_desc">Longest Duration</SelectItem>
                <SelectItem value="title_asc">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video Grid */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-8">
              <Play className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Videos Found
              </h3>
              <p className="text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'No videos match your current filters.'
                  : 'Start by uploading your first match video.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
                  <CardContent className="p-0">
                    {/* Video Thumbnail */}
                    <div className="relative h-48 bg-gray-800 rounded-t-lg overflow-hidden">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button size="sm" className="bg-rosegold hover:bg-rosegold/90">
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                      </div>
                      
                      {/* Duration Badge */}
                      {video.duration > 0 && (
                        <Badge className="absolute bottom-2 right-2 bg-black/60 text-white">
                          {formatDuration(video.duration)}
                        </Badge>
                      )}
                      
                      {/* Status Badge */}
                      <Badge 
                        className={`absolute top-2 right-2 ${getStatusColor(video.ai_analysis_status)} text-white`}
                      >
                        {video.ai_analysis_status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Video Info */}
                      <div>
                        <h3 className="font-semibold text-white line-clamp-1">
                          {video.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                          {video.description || 'No description'}
                        </p>
                      </div>

                      {/* Match Details */}
                      <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {video.match_date ? new Date(video.match_date).toLocaleDateString() : 'No date'}
                        </div>
                        <div>vs {video.opposing_team || 'Unknown'}</div>
                        <div>{video.league || 'Unknown League'}</div>
                        {video.final_score && (
                          <div className="font-semibold">Score: {video.final_score}</div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatFileSize(video.file_size)}</span>
                        <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <video
                              src={video.video_url}
                              controls
                              className="w-full max-h-96"
                            />
                          </DialogContent>
                        </Dialog>
                        
                        {video.ai_analysis_status === 'completed' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Analysis
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl">
                              <VideoAnalysisResults 
                                videoId={video.id} 
                                teamId={video.team_id} 
                                videoType="match"
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteVideo(video.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default VideoManagement;
