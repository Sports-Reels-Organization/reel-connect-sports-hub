
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, FileVideo, Loader2, Save } from 'lucide-react';
import { EnhancedPlayerTagging } from './EnhancedPlayerTagging';
import { MatchStatistics } from './MatchStatistics';
import { compressVideoToTarget } from '@/services/enhancedVideoCompressionService';

interface PlayerWithJersey {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  goals: number;
  assists: number;
  yellowCards: number;
  secondYellows: number;
  redCards: number;
  minutesPlayed: number;
}

interface EnhancedVideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Video metadata
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [opposingTeam, setOpposingTeam] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [homeOrAway, setHomeOrAway] = useState<'home' | 'away'>('home');
  const [leagueCompetition, setLeagueCompetition] = useState('');
  const [region, setRegion] = useState('');
  const [sportType, setSportType] = useState('');
  
  // Player data
  const [taggedPlayers, setTaggedPlayers] = useState<PlayerWithJersey[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [availableLeagues, setAvailableLeagues] = useState<any[]>([]);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from('leagues_competitions')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableLeagues(data || []);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 500MB for original file)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 500MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Compress video
    try {
      setIsCompressing(true);
      toast({
        title: "Compressing Video",
        description: "Optimizing video for upload (targeting 10MB)...",
      });

      const compressed = await compressVideoToTarget(file, {
        targetSizeKB: 10000, // 10MB target
        maxSizeKB: 50000,    // 50MB max
        quality: 0.3
      });
      
      setCompressedFile(compressed);
      
      toast({
        title: "Video Compressed",
        description: `Video compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      setCompressedFile(file);
      toast({
        title: "Compression Failed",
        description: "Using original file for upload",
        variant: "destructive"
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!videoTitle.trim()) errors.push('Video title is required');
    if (!opposingTeam.trim()) errors.push('Opposing team is required');
    if (!leagueCompetition) errors.push('League/Competition is required');
    if (!homeScore || !awayScore) errors.push('Final scores are required');
    if (taggedPlayers.length === 0) errors.push('At least one player must be tagged');
    
    // Check if all tagged players have jersey numbers
    const missingJerseys = taggedPlayers.filter(p => !p.jerseyNumber);
    if (missingJerseys.length > 0) {
      errors.push('All tagged players must have jersey numbers');
    }

    if (errors.length > 0) {
      toast({
        title: "Form Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile || !compressedFile || !profile?.id) return;
    if (!validateForm()) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get team ID
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .single()
        .eq('profile_id', profile.id);

      if (!teamData) {
        throw new Error('Team not found');
      }

      setUploadProgress(20);

      // Upload compressed file to storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      setUploadProgress(80);

      // Prepare jersey numbers mapping
      const jerseyNumbers: Record<string, number> = {};
      taggedPlayers.forEach(player => {
        jerseyNumbers[player.playerId] = player.jerseyNumber;
      });

      // Prepare match statistics
      const totalMatchStats = {
        teamTotals: {
          goals: playerStats.reduce((sum, stat) => sum + stat.goals, 0),
          assists: playerStats.reduce((sum, stat) => sum + stat.assists, 0),
          yellowCards: playerStats.reduce((sum, stat) => sum + stat.yellowCards, 0),
          secondYellows: playerStats.reduce((sum, stat) => sum + stat.secondYellows, 0),
          redCards: playerStats.reduce((sum, stat) => sum + stat.redCards, 0)
        },
        playerStats: playerStats
      };

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          team_id: teamData.id,
          title: videoTitle,
          description: videoDescription,
          video_url: publicUrl,
          opposing_team: opposingTeam,
          match_date: matchDate || null,
          score: `${homeScore}-${awayScore}`,
          home_or_away: homeOrAway,
          video_type: 'match',
          tagged_players: taggedPlayers.map(p => p.playerId),
          jersey_numbers: jerseyNumbers,
          league_competition: leagueCompetition,
          region: region,
          sport_type: sportType,
          total_match_stats: totalMatchStats,
          file_size: compressedFile.size,
          upload_status: 'completed',
          ai_analysis_status: 'pending',
          is_public: true
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Insert individual player statistics
      if (playerStats.length > 0) {
        const matchStatsToInsert = playerStats.map(stat => ({
          video_id: videoData.id,
          player_id: stat.playerId,
          jersey_number: stat.jerseyNumber,
          goals: stat.goals,
          assists: stat.assists,
          yellow_cards: stat.yellowCards,
          second_yellow_cards: stat.secondYellows,
          red_cards: stat.redCards,
          minutes_played: stat.minutesPlayed
        }));

        const { error: statsError } = await supabase
          .from('match_statistics')
          .insert(matchStatsToInsert);

        if (statsError) throw statsError;
      }

      setUploadProgress(100);

      toast({
        title: "Upload Successful",
        description: `Video uploaded with ${taggedPlayers.length} tagged players and complete match statistics`,
      });

      // Reset form
      resetForm();
      onSuccess?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setCompressedFile(null);
    setVideoTitle('');
    setVideoDescription('');
    setOpposingTeam('');
    setMatchDate('');
    setHomeScore('');
    setAwayScore('');
    setLeagueCompetition('');
    setRegion('');
    setSportType('');
    setTaggedPlayers([]);
    setPlayerStats([]);
    setPreviewUrl('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload className="w-5 h-5 text-bright-pink" />
            Enhanced Video Upload
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Selection */}
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8">
              <div className="text-center space-y-4">
                <FileVideo className="w-16 h-16 mx-auto text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Select Video File
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Choose a video file to upload (Max 500MB, will be compressed to ~10MB)
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-bright-pink hover:bg-bright-pink/90"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-64 object-contain"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-white hover:bg-black/50"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Compression Progress */}
              {isCompressing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-bright-pink">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing video to target size...</span>
                  </div>
                  <Progress value={50} className="w-full" />
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-bright-pink">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading video...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          {selectedFile && !isUploading && !isCompressing && (
            <>
              {/* Basic Video Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Video Title *
                    </label>
                    <Input
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      placeholder="Describe the match"
                      className="bg-gray-700 border-gray-600 text-white min-h-24"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Opposing Team *
                    </label>
                    <Input
                      value={opposingTeam}
                      onChange={(e) => setOpposingTeam(e.target.value)}
                      placeholder="Enter opposing team name"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Home or Away *
                    </label>
                    <Select value={homeOrAway} onValueChange={(value) => setHomeOrAway(value as 'home' | 'away')}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Match Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Match Date
                  </label>
                  <Input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Home Score *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="0"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Away Score *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    placeholder="0"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* League/Competition */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    League/Competition *
                  </label>
                  <Select value={leagueCompetition} onValueChange={setLeagueCompetition}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select league" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLeagues.map((league) => (
                        <SelectItem key={league.id} value={league.name}>
                          {league.name} ({league.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Region
                  </label>
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g., Europe, Asia"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sport Type
                  </label>
                  <Select value={sportType} onValueChange={setSportType}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="rugby">Rugby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Size Info */}
              {compressedFile && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Compression Results</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Original Size:</span>
                      <span className="text-white ml-2">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Compressed Size:</span>
                      <span className="text-white ml-2">{(compressedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>
                  {compressedFile.size < selectedFile.size && (
                    <div className="mt-2 text-green-400 text-sm">
                      ✓ Compression saved {((selectedFile.size - compressedFile.size) / (1024 * 1024)).toFixed(1)} MB 
                      ({((1 - compressedFile.size / selectedFile.size) * 100).toFixed(1)}% reduction)
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Player Tagging */}
      {selectedFile && !isUploading && !isCompressing && (
        <EnhancedPlayerTagging
          selectedPlayers={taggedPlayers}
          onPlayersChange={setTaggedPlayers}
        />
      )}

      {/* Match Statistics */}
      {selectedFile && !isUploading && !isCompressing && taggedPlayers.length > 0 && (
        <MatchStatistics
          taggedPlayers={taggedPlayers}
          playerStats={playerStats}
          onStatsChange={setPlayerStats}
        />
      )}

      {/* Action Buttons */}
      {selectedFile && !isUploading && !isCompressing && (
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!videoTitle.trim() || !compressedFile || taggedPlayers.length === 0}
            className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Video to Team Profile
            {taggedPlayers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {taggedPlayers.length} players
              </Badge>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-600 text-gray-300"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
