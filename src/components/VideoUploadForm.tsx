
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, Play, Users, Trophy, Target, AlertCircle } from 'lucide-react';
import { compressVideo, getVideoDuration, VideoFile } from '@/services/videoCompressionService';

interface League {
  id: string;
  name: string;
  country: string;
  sport_type: string;
  region?: string;
}

interface Player {
  id: string;
  full_name: string;
  jersey_number: number;
  position: string;
}

interface PlayerStat {
  playerId: string;
  jerseyNumber: number;
  goals: number;
  assists: number;
  yellowCards: number;
  secondYellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

interface VideoUploadFormProps {
  onUploadComplete: () => void;
  onClose: () => void;
}

export const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onUploadComplete, onClose }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    homeOrAway: '',
    opposingTeam: '',
    leagueId: '',
    finalScoreHome: 0,
    finalScoreAway: 0,
    matchDate: ''
  });

  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const [teamId, setTeamId] = useState<string>('');

  React.useEffect(() => {
    fetchInitialData();
  }, [profile]);

  const fetchInitialData = async () => {
    if (!profile?.id) return;

    try {
      // Get team ID
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (team) {
        setTeamId(team.id);
        
        // Fetch players
        const { data: playersData } = await supabase
          .from('players')
          .select('id, full_name, jersey_number, position')
          .eq('team_id', team.id)
          .order('jersey_number');

        setPlayers(playersData || []);
      }

      // Fetch leagues
      const { data: leaguesData } = await supabase
        .from('leagues')
        .select('*')
        .order('name');

      setLeagues(leaguesData || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      // Simulate compression progress
      const progressInterval = setInterval(() => {
        setCompressionProgress(prev => {
          const newProgress = prev + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);

      const compressedFile = await compressVideo(file, { maxSizeMB: 10, quality: 0.8 });
      
      clearInterval(progressInterval);
      setCompressionProgress(100);
      
      setVideoFile(compressedFile);
      
      toast({
        title: "Video Compressed",
        description: `Video compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      });
    } catch (error) {
      toast({
        title: "Compression Failed",
        description: "Failed to compress video. Please try a smaller file.",
        variant: "destructive"
      });
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const addPlayerStat = () => {
    const newStat: PlayerStat = {
      playerId: '',
      jerseyNumber: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      secondYellowCards: 0,
      redCards: 0,
      minutesPlayed: 90
    };
    setPlayerStats([...playerStats, newStat]);
  };

  const updatePlayerStat = (index: number, field: keyof PlayerStat, value: string | number) => {
    const updatedStats = [...playerStats];
    if (field === 'playerId') {
      const player = players.find(p => p.id === value);
      if (player) {
        updatedStats[index].jerseyNumber = player.jersey_number;
      }
    }
    updatedStats[index] = { ...updatedStats[index], [field]: value };
    setPlayerStats(updatedStats);
  };

  const removePlayerStat = (index: number) => {
    setPlayerStats(playerStats.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!videoFile || !teamId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload a video",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload video to Supabase Storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${teamId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 80 ? 80 : newProgress;
        });
      }, 300);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-videos')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-videos')
        .getPublicUrl(fileName);

      setUploadProgress(90);

      // Save video metadata to database
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          team_id: teamId,
          title: formData.title,
          description: formData.description || null,
          video_url: publicUrl,
          home_or_away: formData.homeOrAway,
          opposing_team: formData.opposingTeam,
          league_id: formData.leagueId || null,
          final_score_home: formData.finalScoreHome,
          final_score_away: formData.finalScoreAway,
          match_date: formData.matchDate || null,
          file_size: videoFile.size,
          tagged_players: taggedPlayers,
          upload_status: 'completed',
          is_public: true
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Save match statistics
      if (playerStats.length > 0) {
        const statsToInsert = playerStats.map(stat => ({
          video_id: videoData.id,
          player_id: stat.playerId || null,
          jersey_number: stat.jerseyNumber,
          goals: stat.goals,
          assists: stat.assists,
          yellow_cards: stat.yellowCards,
          second_yellow_cards: stat.secondYellowCards,
          red_cards: stat.redCards,
          minutes_played: stat.minutesPlayed
        }));

        const { error: statsError } = await supabase
          .from('match_statistics')
          .insert(statsToInsert);

        if (statsError) console.error('Error saving stats:', statsError);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Upload Complete",
        description: "Video uploaded successfully with AI analysis starting",
      });

      onUploadComplete();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload video',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-900 border-rosegold/20">
      <CardHeader className="border-b border-rosegold/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-polysans text-2xl">Upload Match Video</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Video Upload Section */}
        <div className="space-y-4">
          <Label className="text-white text-lg font-semibold">Video File</Label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!videoFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-rosegold/30 rounded-lg p-8 text-center cursor-pointer hover:border-rosegold/60 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-rosegold" />
              <p className="text-white font-medium mb-2">Click to upload video</p>
              <p className="text-gray-400 text-sm">Supports MP4, MOV, AVI (will be compressed to &lt;10MB)</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Play className="w-8 h-8 text-rosegold" />
                <div>
                  <p className="text-white font-medium">{videoFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(videoFile.size / 1024 / 1024).toFixed(2)}MB
                    {videoFile.compressed && " (compressed)"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVideoFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isCompressing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Compressing video...</Label>
                <span className="text-rosegold">{compressionProgress}%</span>
              </div>
              <Progress value={compressionProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Match title"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Match Date</Label>
            <Input
              type="date"
              value={formData.matchDate}
              onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="bg-gray-800 border-gray-600 text-white resize-none"
            placeholder="Match description..."
            rows={3}
          />
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Home/Away *</Label>
            <Select
              value={formData.homeOrAway}
              onValueChange={(value) => setFormData(prev => ({ ...prev, homeOrAway: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="away">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Opposing Team *</Label>
            <Input
              value={formData.opposingTeam}
              onChange={(e) => setFormData(prev => ({ ...prev, opposingTeam: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Team name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">League/Competition</Label>
            <Select
              value={formData.leagueId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, leagueId: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select league..." />
              </SelectTrigger>
              <SelectContent>
                {leagues.map((league) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name} ({league.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Final Score */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">
              {formData.homeOrAway === 'home' ? 'Our Score' : 'Away Score'}
            </Label>
            <Input
              type="number"
              min="0"
              value={formData.finalScoreHome}
              onChange={(e) => setFormData(prev => ({ ...prev, finalScoreHome: parseInt(e.target.value) || 0 }))}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">
              {formData.homeOrAway === 'home' ? 'Away Score' : 'Our Score'}
            </Label>
            <Input
              type="number"
              min="0"
              value={formData.finalScoreAway}
              onChange={(e) => setFormData(prev => ({ ...prev, finalScoreAway: parseInt(e.target.value) || 0 }))}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>

        {/* Player Statistics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Player Statistics
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPlayerStat}
              className="border-rosegold text-rosegold hover:bg-rosegold hover:text-black"
            >
              <Users className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {playerStats.map((stat, index) => (
              <Card key={index} className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
                    <div className="col-span-2">
                      <Label className="text-white text-sm">Player</Label>
                      <Select
                        value={stat.playerId}
                        onValueChange={(value) => updatePlayerStat(index, 'playerId', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-500 text-white">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              #{player.jersey_number} {player.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white text-xs">Goals</Label>
                      <Input
                        type="number"
                        min="0"
                        value={stat.goals}
                        onChange={(e) => updatePlayerStat(index, 'goals', parseInt(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-500 text-white h-9"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-xs">Assists</Label>
                      <Input
                        type="number"
                        min="0"
                        value={stat.assists}
                        onChange={(e) => updatePlayerStat(index, 'assists', parseInt(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-500 text-white h-9"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-xs">Yellow</Label>
                      <Input
                        type="number"
                        min="0"
                        max="2"
                        value={stat.yellowCards}
                        onChange={(e) => updatePlayerStat(index, 'yellowCards', parseInt(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-500 text-white h-9"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-xs">Red</Label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        value={stat.redCards}
                        onChange={(e) => updatePlayerStat(index, 'redCards', parseInt(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-500 text-white h-9"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-xs">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="120"
                        value={stat.minutesPlayed}
                        onChange={(e) => updatePlayerStat(index, 'minutesPlayed', parseInt(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-500 text-white h-9"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayerStat(index)}
                      className="text-red-400 hover:text-red-300 h-9"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Uploading video...</Label>
              <span className="text-rosegold">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!videoFile || isUploading || isCompressing || !formData.title || !formData.homeOrAway || !formData.opposingTeam}
            className="flex-1 bg-rosegold hover:bg-rosegold/90 text-black font-polysans"
          >
            {isUploading ? 'Uploading...' : 'Upload Video & Start AI Analysis'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
        </div>

        {(!formData.title || !formData.homeOrAway || !formData.opposingTeam || !videoFile) && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-400">
              <p className="font-medium">Required fields missing:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {!videoFile && <li>Video file</li>}
                {!formData.title && <li>Title</li>}
                {!formData.homeOrAway && <li>Home/Away selection</li>}
                {!formData.opposingTeam && <li>Opposing team</li>}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;
