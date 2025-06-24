
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Video, Play, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabaseVideo = Tables<'match_videos'>;
type DatabasePlayer = Tables<'players'>;

interface VideoForm {
  title: string;
  opposing_team: string;
  league: string;
  final_score: string;
  match_date: string;
  home_or_away: 'home' | 'away' | '';
  tagged_players: { player_id: string; jersey_number: string; player_name: string }[];
  match_stats: {
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
  };
}

const leagues = [
  'NLO', 'NNL', 'NPFL', 'N-YOUTH LEAGUE', 'TCC', 'FEDERATION CUP', 'FA CUP',
  'CAF Champions League', 'CAF Confederation Cup', 'AFCON', 'World Cup', 'Premier League',
  'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'
];

const VideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoForm, setVideoForm] = useState<VideoForm>({
    title: '',
    opposing_team: '',
    league: '',
    final_score: '',
    match_date: '',
    home_or_away: '',
    tagged_players: [],
    match_stats: {
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0
    }
  });

  useEffect(() => {
    fetchTeamData();
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      fetchVideos();
      fetchPlayers();
    }
  }, [teamId]);

  const fetchTeamData = async () => {
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
        .from('match_videos')
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
        .order('jersey_number');

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const compressVideo = async (file: File): Promise<File> => {
    // For now, return the original file
    // In a real implementation, you would use a video compression library
    // or send to a server-side compression service
    return file;
  };

  const handleVideoUpload = async (file: File) => {
    if (!file || !teamId) return null;

    try {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error('Please select a video file');
      }

      // Compress video (placeholder implementation)
      const compressedFile = await compressVideo(file);

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('match-videos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        size: compressedFile.size,
        duration: 0 // Would be calculated in real implementation
      };
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSaveVideo = async () => {
    if (!teamId || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a video file",
        variant: "destructive"
      });
      return;
    }

    if (!videoForm.title || !videoForm.opposing_team || !videoForm.league || !videoForm.home_or_away) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      const uploadResult = await handleVideoUpload(selectedFile);
      if (!uploadResult) throw new Error('Video upload failed');

      const videoData = {
        team_id: teamId,
        title: videoForm.title,
        video_url: uploadResult.url,
        opposing_team: videoForm.opposing_team,
        league: videoForm.league,
        final_score: videoForm.final_score || null,
        match_date: videoForm.match_date || null,
        home_or_away: videoForm.home_or_away,
        tagged_players: videoForm.tagged_players,
        match_stats: videoForm.match_stats,
        duration: uploadResult.duration,
        file_size: uploadResult.size,
        is_processed: true
      };

      const { error } = await supabase
        .from('match_videos')
        .insert(videoData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      resetForm();
      fetchVideos();

    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: "Error",
        description: "Failed to save video",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const addTaggedPlayer = () => {
    setVideoForm(prev => ({
      ...prev,
      tagged_players: [
        ...prev.tagged_players,
        { player_id: '', jersey_number: '', player_name: '' }
      ]
    }));
  };

  const removeTaggedPlayer = (index: number) => {
    setVideoForm(prev => ({
      ...prev,
      tagged_players: prev.tagged_players.filter((_, i) => i !== index)
    }));
  };

  const updateTaggedPlayer = (index: number, field: string, value: string) => {
    setVideoForm(prev => ({
      ...prev,
      tagged_players: prev.tagged_players.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  const resetForm = () => {
    setVideoForm({
      title: '',
      opposing_team: '',
      league: '',
      final_score: '',
      match_date: '',
      home_or_away: '',
      tagged_players: [],
      match_stats: {
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0
      }
    });
    setSelectedFile(null);
    setShowAddForm(false);
  };

  if (profile?.user_type !== 'team') {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-polysans text-3xl font-bold text-white mb-2">
            Video Management
          </h1>
          <p className="text-gray-400">
            Upload and manage match videos with player tagging
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-rosegold hover:bg-rosegold/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Upload Video Form */}
      {showAddForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-polysans text-white">
              Upload Match Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video File Upload */}
            <div className="space-y-2">
              <Label className="text-white">Video File *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {selectedFile ? (
                  <div className="space-y-2">
                    <Video className="w-12 h-12 mx-auto text-rosegold" />
                    <p className="text-white">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <Button
                      onClick={() => setSelectedFile(null)}
                      variant="outline"
                      size="sm"
                      className="text-gray-400"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-white">Click to upload video file</p>
                    <p className="text-gray-400 text-sm">MP4, MOV, AVI supported</p>
                    <label className="cursor-pointer">
                      <Button variant="outline" className="text-gray-400">
                        Select Video
                      </Button>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Video Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Video Title *</Label>
                <Input
                  id="title"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., Match vs Arsenal FC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposing_team" className="text-white">Opposing Team *</Label>
                <Input
                  id="opposing_team"
                  value={videoForm.opposing_team}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, opposing_team: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., Arsenal FC"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">League/Competition *</Label>
                <Select 
                  value={videoForm.league} 
                  onValueChange={(value) => setVideoForm(prev => ({ ...prev, league: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-white">
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {leagues.map((league) => (
                      <SelectItem key={league} value={league} className="text-white">
                        {league}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Home or Away *</Label>
                <Select 
                  value={videoForm.home_or_away} 
                  onValueChange={(value: 'home' | 'away') => setVideoForm(prev => ({ ...prev, home_or_away: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-white">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="home" className="text-white">Home</SelectItem>
                    <SelectItem value="away" className="text-white">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="final_score" className="text-white">Final Score</Label>
                <Input
                  id="final_score"
                  value={videoForm.final_score}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, final_score: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., 2-1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="match_date" className="text-white">Match Date</Label>
                <Input
                  id="match_date"
                  type="date"
                  value={videoForm.match_date}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, match_date: e.target.value }))}
                  className="bg-background border-border text-white"
                />
              </div>
            </div>

            {/* Match Statistics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Match Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goals" className="text-white">Goals</Label>
                  <Input
                    id="goals"
                    type="number"
                    value={videoForm.match_stats.goals}
                    onChange={(e) => setVideoForm(prev => ({
                      ...prev,
                      match_stats: { ...prev.match_stats, goals: parseInt(e.target.value) || 0 }
                    }))}
                    className="bg-background border-border text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assists" className="text-white">Assists</Label>
                  <Input
                    id="assists"
                    type="number"
                    value={videoForm.match_stats.assists}
                    onChange={(e) => setVideoForm(prev => ({
                      ...prev,
                      match_stats: { ...prev.match_stats, assists: parseInt(e.target.value) || 0 }
                    }))}
                    className="bg-background border-border text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yellow_cards" className="text-white">Yellow Cards</Label>
                  <Input
                    id="yellow_cards"
                    type="number"
                    value={videoForm.match_stats.yellow_cards}
                    onChange={(e) => setVideoForm(prev => ({
                      ...prev,
                      match_stats: { ...prev.match_stats, yellow_cards: parseInt(e.target.value) || 0 }
                    }))}
                    className="bg-background border-border text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="red_cards" className="text-white">Red Cards</Label>
                  <Input
                    id="red_cards"
                    type="number"
                    value={videoForm.match_stats.red_cards}
                    onChange={(e) => setVideoForm(prev => ({
                      ...prev,
                      match_stats: { ...prev.match_stats, red_cards: parseInt(e.target.value) || 0 }
                    }))}
                    className="bg-background border-border text-white"
                  />
                </div>
              </div>
            </div>

            {/* Tagged Players */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Tagged Players</h3>
                <Button
                  type="button"
                  onClick={addTaggedPlayer}
                  variant="outline"
                  size="sm"
                  className="text-gray-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </div>

              {videoForm.tagged_players.map((taggedPlayer, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-white">Player</Label>
                    <Select
                      value={taggedPlayer.player_id}
                      onValueChange={(value) => {
                        const player = players.find(p => p.id === value);
                        updateTaggedPlayer(index, 'player_id', value);
                        updateTaggedPlayer(index, 'player_name', player?.full_name || '');
                        updateTaggedPlayer(index, 'jersey_number', player?.jersey_number?.toString() || '');
                      }}
                    >
                      <SelectTrigger className="bg-background border-border text-white">
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id} className="text-white">
                            #{player.jersey_number} - {player.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Jersey Number</Label>
                    <Input
                      value={taggedPlayer.jersey_number}
                      onChange={(e) => updateTaggedPlayer(index, 'jersey_number', e.target.value)}
                      className="bg-background border-border text-white"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Player Name</Label>
                    <Input
                      value={taggedPlayer.player_name}
                      onChange={(e) => updateTaggedPlayer(index, 'player_name', e.target.value)}
                      className="bg-background border-border text-white"
                      placeholder="Player name"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => removeTaggedPlayer(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSaveVideo}
                disabled={loading || uploading}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Upload Video'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="bg-card border-border hover:border-rosegold/50 transition-colors">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <Play className="w-12 h-12 text-rosegold" />
                </div>
                
                <div>
                  <h3 className="font-polysans font-semibold text-white mb-1">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-400">vs {video.opposing_team}</p>
                  <p className="text-sm text-rosegold">{video.league}</p>
                </div>

                <div className="space-y-2 text-sm">
                  {video.final_score && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Score:</span>
                      <span className="text-white">{video.final_score}</span>
                    </div>
                  )}
                  {video.match_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white">{new Date(video.match_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Venue:</span>
                    <span className="text-white capitalize">{video.home_or_away}</span>
                  </div>
                  {video.file_size && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span className="text-white">{(video.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && !showAddForm && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="font-polysans text-xl font-semibold text-white mb-2">
              No Videos Uploaded Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Start by uploading match videos with player tags and statistics
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-rosegold hover:bg-rosegold/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Your First Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoManagement;
