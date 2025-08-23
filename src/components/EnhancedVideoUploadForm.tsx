
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
import { Upload, X, FileVideo, Loader2, Save, Camera, RefreshCw, Trash2 } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  
  // Video metadata
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoType, setVideoType] = useState<'match' | 'interview' | 'training' | 'highlight'>('match');
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
  const [userTeam, setUserTeam] = useState<any>(null);

  useEffect(() => {
    fetchLeagues();
    fetchUserTeam();
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

  const fetchUserTeam = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();

      if (error) throw error;
      setUserTeam(data);
      setSportType(data?.sport_type || '');
    } catch (error) {
      console.error('Error fetching user team:', error);
    }
  };

  const generateThumbnail = async (videoElement: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas dimensions
      canvas.width = 320;
      canvas.height = 180;

      // Seek to 10% of video duration for thumbnail
      videoElement.currentTime = videoElement.duration * 0.1;
      
      videoElement.addEventListener('seeked', () => {
        try {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
        } catch (error) {
          reject(error);
        }
      }, { once: true });
    });
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

    // Generate thumbnail when video loads
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', async () => {
        try {
          const thumbnail = await generateThumbnail(videoRef.current!);
          setThumbnailBlob(thumbnail);
          setThumbnailUrl(URL.createObjectURL(thumbnail));
        } catch (error) {
          console.error('Error generating thumbnail:', error);
        }
      }, { once: true });
    }

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
    
    if (videoType === 'match') {
      if (!opposingTeam.trim()) errors.push('Opposing team is required for match videos');
      if (!homeScore || !awayScore) errors.push('Final scores are required for match videos');
      if (taggedPlayers.length === 0) errors.push('At least one player must be tagged for match videos');
      
      // Check if all tagged players have jersey numbers
      const missingJerseys = taggedPlayers.filter(p => !p.jerseyNumber);
      if (missingJerseys.length > 0) {
        errors.push('All tagged players must have jersey numbers for match videos');
      }
    }
    
    if (!leagueCompetition) errors.push('League/Competition is required');

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

  const analyzeVideoWithAI = async (videoId: string, videoUrl: string, videoType: string) => {
    try {
      const response = await supabase.functions.invoke('analyze-video', {
        body: {
          videoId,
          videoUrl,
          videoType,
          videoTitle,
          videoDescription,
          opposingTeam: videoType === 'match' ? opposingTeam : null,
          playerStats: videoType === 'match' ? playerStats : [],
          taggedPlayers: videoType === 'match' ? taggedPlayers : []
        }
      });

      if (response.error) {
        console.error('AI Analysis error:', response.error);
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error analyzing video:', error);
      throw error;
    }
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
        .eq('profile_id', profile.id)
        .single();

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

      setUploadProgress(40);

      // Upload thumbnail if available
      let thumbnailPublicUrl = '';
      if (thumbnailBlob) {
        const thumbnailFileName = `${Date.now()}-thumbnail.jpg`;
        const { error: thumbnailError } = await supabase.storage
          .from('video-thumbnails')
          .upload(thumbnailFileName, thumbnailBlob);

        if (!thumbnailError) {
          const { data: { publicUrl } } = supabase.storage
            .from('video-thumbnails')
            .getPublicUrl(thumbnailFileName);
          thumbnailPublicUrl = publicUrl;
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      setUploadProgress(60);

      // Prepare jersey numbers mapping
      const jerseyNumbers: Record<string, number> = {};
      taggedPlayers.forEach(player => {
        jerseyNumbers[player.playerId] = player.jerseyNumber;
      });

      // Prepare match statistics
      const totalMatchStats = videoType === 'match' ? {
        teamTotals: {
          goals: playerStats.reduce((sum, stat) => sum + stat.goals, 0),
          assists: playerStats.reduce((sum, stat) => sum + stat.assists, 0),
          yellowCards: playerStats.reduce((sum, stat) => sum + stat.yellowCards, 0),
          secondYellows: playerStats.reduce((sum, stat) => sum + stat.secondYellows, 0),
          redCards: playerStats.reduce((sum, stat) => sum + stat.redCards, 0)
        },
        playerStats: playerStats
      } : {};

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          team_id: teamData.id,
          title: videoTitle,
          description: videoDescription,
          video_url: publicUrl,
          thumbnail_url: thumbnailPublicUrl,
          video_type: videoType,
          opposing_team: videoType === 'match' ? opposingTeam : null,
          match_date: videoType === 'match' ? matchDate || null : null,
          score: videoType === 'match' ? `${homeScore}-${awayScore}` : null,
          home_or_away: videoType === 'match' ? homeOrAway : null,
          tagged_players: videoType === 'match' ? taggedPlayers.map(p => p.playerId) : [],
          jersey_numbers: videoType === 'match' ? jerseyNumbers : {},
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

      setUploadProgress(80);

      // Insert individual player statistics for match videos
      if (videoType === 'match' && playerStats.length > 0) {
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

      setUploadProgress(90);

      // Start AI analysis in background
      try {
        await analyzeVideoWithAI(videoData.id, publicUrl, videoType);
        
        // Update video status to analyzed
        await supabase
          .from('videos')
          .update({ ai_analysis_status: 'completed' })
          .eq('id', videoData.id);
      } catch (analysisError) {
        console.error('AI Analysis failed:', analysisError);
        
        // Update video status to failed
        await supabase
          .from('videos')
          .update({ ai_analysis_status: 'failed' })
          .eq('id', videoData.id);
      }

      setUploadProgress(100);

      toast({
        title: "Upload Successful",
        description: `${videoType.charAt(0).toUpperCase() + videoType.slice(1)} video uploaded successfully. AI analysis ${videoType === 'match' ? 'with match statistics' : 'in progress'}.`,
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
    setVideoType('match');
    setOpposingTeam('');
    setMatchDate('');
    setHomeScore('');
    setAwayScore('');
    setLeagueCompetition('');
    setRegion('');
    setTaggedPlayers([]);
    setPlayerStats([]);
    setPreviewUrl('');
    setThumbnailBlob(null);
    setThumbnailUrl('');
    
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
              {/* Video Preview with Thumbnail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
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
                
                {thumbnailUrl && (
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <img
                      src={thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-64 object-contain"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Thumbnail
                    </div>
                  </div>
                )}
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
                    <span>Uploading video and analyzing with AI...</span>
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
                      Video Type *
                    </label>
                    <Select value={videoType} onValueChange={(value) => setVideoType(value as any)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">Match</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      placeholder={`Describe the ${videoType}`}
                      className="bg-gray-700 border-gray-600 text-white min-h-24"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {videoType === 'match' && (
                    <>
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
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sport Type
                    </label>
                    <Input
                      value={sportType}
                      onChange={(e) => setSportType(e.target.value)}
                      placeholder="Automatically set from team profile"
                      className="bg-gray-700 border-gray-600 text-white"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Match-specific fields */}
              {videoType === 'match' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              )}

              {/* League/Competition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* AI Analysis Info */}
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4" />
                  AI Analysis Features
                </h4>
                <div className="text-sm text-blue-300 space-y-1">
                  {videoType === 'match' && (
                    <p>• Match analysis: Goals, assists, fouls, cards, substitutions, key passes, tactical insights</p>
                  )}
                  {videoType === 'interview' && (
                    <p>• Interview summary: Key points discussed, main topics, insights shared</p>
                  )}
                  {videoType === 'training' && (
                    <p>• Training analysis: Performance assessment, improvement recommendations, fitness insights</p>
                  )}
                  {videoType === 'highlight' && (
                    <p>• Highlight summary: Key moments, standout performances, memorable plays</p>
                  )}
                  <p>• Video will be marked as "Pending" during analysis, then moved to "Analyzed" when complete</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Player Tagging - Only for match videos */}
      {selectedFile && !isUploading && !isCompressing && videoType === 'match' && (
        <EnhancedPlayerTagging
          selectedPlayers={taggedPlayers}
          onPlayersChange={setTaggedPlayers}
        />
      )}

      {/* Match Statistics - Only for match videos */}
      {selectedFile && !isUploading && !isCompressing && videoType === 'match' && taggedPlayers.length > 0 && (
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
            disabled={!videoTitle.trim() || !compressedFile || !leagueCompetition || (videoType === 'match' && (!opposingTeam.trim() || taggedPlayers.length === 0))}
            className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Upload & Analyze Video
            {videoType === 'match' && taggedPlayers.length > 0 && (
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
