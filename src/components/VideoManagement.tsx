import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Upload, Plus, Video, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import PlayerDetailModal from './PlayerDetailModal';
import { validateVideoUrl } from '@/utils/videoValidation';

type DatabaseVideo = Tables<'videos'>;
type DatabasePlayer = Tables<'players'>;

interface VideoForm {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  video_type: string;
  match_date: string;
  opposing_team: string;
  score: string;
  tags: string[];
  tagged_players: string[];
}

const VideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<DatabasePlayer | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [videoForm, setVideoForm] = useState<VideoForm>({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    video_type: 'highlight',
    match_date: '',
    opposing_team: '',
    score: '',
    tags: [],
    tagged_players: []
  });

  useEffect(() => {
    fetchTeamId();
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      fetchVideos();
      fetchPlayers();
    }
  }, [teamId]);

  const fetchTeamId = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        return;
      }

      if (data) {
        setTeamId(data.id);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchVideos = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchPlayers = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('full_name');

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleVideoUrlChange = (url: string) => {
    setVideoForm(prev => ({ ...prev, video_url: url }));

    if (url) {
      const validation = validateVideoUrl(url);
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  };

  const handleSaveVideo = async () => {
    if (!teamId) {
      toast({
        title: "Error",
        description: "Team not found. Please complete your team profile setup.",
        variant: "destructive"
      });
      return;
    }

    if (!videoForm.title || !videoForm.video_url) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and video URL",
        variant: "destructive"
      });
      return;
    }

    // Validate video URL
    const urlValidation = validateVideoUrl(videoForm.video_url);
    if (!urlValidation.isValid) {
      toast({
        title: "Invalid Video URL",
        description: urlValidation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to save video with data:', {
        team_id: teamId,
        title: videoForm.title,
        description: videoForm.description || null,
        video_url: videoForm.video_url,
        thumbnail_url: videoForm.thumbnail_url || null,
        video_type: videoForm.video_type,
        match_date: videoForm.match_date || null,
        opposing_team: videoForm.opposing_team || null,
        score: videoForm.score || null,
        tags: videoForm.tags,
        tagged_players: videoForm.tagged_players,
        is_public: true
      });

      const { data, error } = await supabase
        .from('videos')
        .insert({
          team_id: teamId,
          title: videoForm.title,
          description: videoForm.description || null,
          video_url: videoForm.video_url,
          thumbnail_url: videoForm.thumbnail_url || null,
          video_type: videoForm.video_type,
          match_date: videoForm.match_date || null,
          opposing_team: videoForm.opposing_team || null,
          score: videoForm.score || null,
          tags: videoForm.tags,
          tagged_players: videoForm.tagged_players,
          is_public: true
        })
        .select();

      if (error) {
        console.error('Database error details:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Video saved successfully:', data);

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      resetForm();
      fetchVideos();
    } catch (error: any) {
      console.error('Error saving video:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to upload video. Please try again.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVideoForm({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      video_type: 'highlight',
      match_date: '',
      opposing_team: '',
      score: '',
      tags: [],
      tagged_players: []
    });
    setShowAddForm(false);
  };

  const addTag = (tag: string) => {
    if (tag && !videoForm.tags.includes(tag)) {
      setVideoForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setVideoForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePlayerTag = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setSelectedPlayer(player);
    }
  };

  const addPlayerTag = (playerId: string) => {
    if (playerId && !videoForm.tagged_players.includes(playerId)) {
      setVideoForm(prev => ({
        ...prev,
        tagged_players: [...prev.tagged_players, playerId]
      }));
    }
  };

  const removePlayerTag = (playerIdToRemove: string) => {
    setVideoForm(prev => ({
      ...prev,
      tagged_players: prev.tagged_players.filter(id => id !== playerIdToRemove)
    }));
  };

  const getTaggedPlayerNames = (video: DatabaseVideo) => {
    // Handle the Json type from database - it could be null, string[], or other Json types
    const taggedPlayersData = video.tagged_players;
    if (!taggedPlayersData || !Array.isArray(taggedPlayersData)) return [];

    return (taggedPlayersData as string[])
      .map((playerId: string) => {
        const player = players.find(p => p.id === playerId);
        return player ? { id: playerId, name: player.full_name } : null;
      })
      .filter(Boolean);
  };

  if (profile?.user_type !== 'team') {
    return null;
  }

  return (
    <div className="p-[3rem] space-y-6 max-w-6xl mx-auto bg-[#111111] min-h-screen">
      <div className="flex items-center justify-between">
        <div className='text-start'>
          <h1 className="font-polysans text-3xl font-bold text-white mb-2">
            Video Management
          </h1>
          <p className="text-gray-400 font-poppins">
            Upload and manage match highlights and player videos (landscape orientation only)
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Upload Form */}
      {showAddForm && (
        <Card className="bg-[#1a1a1a] border-0">
          <CardHeader>
            <CardTitle className="font-polysans text-white">Upload New Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-[#111111] border-0 text-white"
                  placeholder="Video title"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Video Type</Label>
                <Select
                  value={videoForm.video_type}
                  onValueChange={(value) => setVideoForm(prev => ({ ...prev, video_type: value }))}
                >
                  <SelectTrigger className="bg-[#111111] border-0 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-0">
                    <SelectItem value="highlight" className="text-white">Highlight</SelectItem>
                    <SelectItem value="full_match" className="text-white">Full Match</SelectItem>
                    <SelectItem value="training" className="text-white">Training</SelectItem>
                    <SelectItem value="interview" className="text-white">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url" className="text-white">Video URL *</Label>
              <Input
                id="video_url"
                value={videoForm.video_url}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                className="bg-[#111111] border-0 text-white"
                placeholder="https://youtube.com/watch?v=... (landscape videos only)"
              />
              {validationErrors.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-400">
                    {validationErrors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url" className="text-white">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={videoForm.thumbnail_url}
                onChange={(e) => setVideoForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                className="bg-[#1a1a1a] border-2 border-[#ffffff28] text-white"
                placeholder="Optional thumbnail image URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={videoForm.description}
                onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                className="bg-[#1a1a1a] border-2 border-[#ffffff28] text-white resize-none"
                placeholder="Video description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="match_date" className="text-white">Match Date</Label>
                <Input
                  id="match_date"
                  type="date"
                  value={videoForm.match_date}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, match_date: e.target.value }))}
                  className="bg-[#1a1a1a] border-2 border-[#ffffff28] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposing_team" className="text-white">Opposing Team</Label>
                <Input
                  id="opposing_team"
                  value={videoForm.opposing_team}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, opposing_team: e.target.value }))}
                  className="bg-[#1a1a1a] border-2 border-[#ffffff28] text-white"
                  placeholder="Team name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score" className="text-white">Final Score</Label>
                <Input
                  id="score"
                  value={videoForm.score}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, score: e.target.value }))}
                  className="bg-[#1a1a1a] border-2 border-[#ffffff28] text-white"
                  placeholder="e.g., 2-1"
                />
              </div>
            </div>

            {/* Player Tagging */}
            <div className="space-y-2">
              <Label className="text-white">Tag Players</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {videoForm.tagged_players.map((playerId) => {
                  const player = players.find(p => p.id === playerId);
                  return player ? (
                    <Badge
                      key={playerId}
                      variant="secondary"
                      className="cursor-pointer border-2 border-[#ffffff28]"
                      onClick={() => removePlayerTag(playerId)}
                    >
                      {player.full_name} ×
                    </Badge>
                  ) : null;
                })}
              </div>
              <Select onValueChange={addPlayerTag}>
                <SelectTrigger className="bg-[#1a1a1a] border-2 border-[#ffffff28] text-white">
                  <SelectValue placeholder="Select players to tag" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-0">
                  {players.map((player) => (
                    <SelectItem
                      key={player.id}
                      value={player.id}
                      className="text-white"
                    >
                      {player.full_name} - #{player.jersey_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-white">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {videoForm.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer border-2 border-[#ffffff28]"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter)"
                className="bg-[#1a1a1a] border-2 border-[#ffffff28] text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    addTag(input.value.trim());
                    input.value = '';
                  }
                }}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSaveVideo}
                disabled={loading || validationErrors.length > 0}
                className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans border-0"
              >
                {loading ? 'Uploading...' : 'Upload Video'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-0 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="bg-[#1a1a1a] border-0 hover:border-rosegold/50 transition-colors">
            <CardContent className="p-4">
              <div className="relative mb-4">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <Button
                  size="sm"
                  className="absolute inset-0 bg-black/50 hover:bg-black/70 text-white opacity-0 hover:opacity-100 transition-opacity border-0"
                  onClick={() => window.open(video.video_url, '_blank')}
                >
                  <Play className="w-8 h-8" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-polysans font-semibold text-white text-lg mb-1">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 font-poppins">
                      {video.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline" className="text-rosegold border-rosegold">
                    {video.video_type.toUpperCase()}
                  </Badge>
                  {video.match_date && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(video.match_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {video.opposing_team && (
                  <p className="text-sm text-gray-400">
                    vs {video.opposing_team}
                    {video.score && ` (${video.score})`}
                  </p>
                )}

                {/* Tagged Players */}
                {getTaggedPlayerNames(video).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Tagged Players:</Label>
                    <div className="flex flex-wrap gap-1">
                      {getTaggedPlayerNames(video).map((player: any) => (
                        <Badge
                          key={player.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-bright-pink hover:text-white border-0"
                          onClick={() => handlePlayerTag(player.id)}
                        >
                          <User className="w-3 h-3 mr-1" />
                          {player.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Tags:</Label>
                    <div className="flex flex-wrap gap-1">
                      {video.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-gray-400 border-0">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && !showAddForm && (
        <Card className="bg-[#1a1a1a] border-0">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="font-polysans text-xl font-semibold text-white mb-2">
              No Videos Uploaded Yet
            </h3>
            <p className="text-gray-400 mb-6 font-poppins">
              Start showcasing your team by uploading match highlights and player videos
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans border-0"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Video
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onEdit={() => {
            // Navigate to player edit or handle edit action
            setSelectedPlayer(null);
          }}
        />
      )}
    </div>
  );
};

export default VideoManagement;
