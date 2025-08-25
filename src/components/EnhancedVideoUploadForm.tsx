
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Video,
  FileText,
  Users,
  Calendar,
  Trophy,
  Loader2,
  CheckCircle,
  AlertCircle,
  Minimize2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVideoCompressionService from '@/services/enhancedVideoCompressionService';
import { EnhancedAIAnalysisService } from '@/services/enhancedAIAnalysisService';

interface VideoMetadata {
  title: string;
  description: string;
  videoType: 'match' | 'training' | 'interview' | 'highlight';
  playerTags: string[];
  matchDetails?: {
    opposingTeam: string;
    matchDate: string;
    league: string;
    homeOrAway: 'home' | 'away';
    finalScore: string;
  };
}

interface TeamPlayer {
  id: string;
  full_name: string;
  position: string;
  jersey_number?: number;
}

interface EnhancedVideoUploadFormProps {
  teamId: string;
  onUploadComplete?: (videoId: string) => void;
}

const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({
  teamId,
  onUploadComplete
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
  } | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    videoType: 'match',
    playerTags: [],
    matchDetails: {
      opposingTeam: '',
      matchDate: '',
      league: '',
      homeOrAway: 'home',
      finalScore: ''
    }
  });

  const videoCompressionService = new EnhancedVideoCompressionService();
  const aiAnalysisService = new EnhancedAIAnalysisService();

  // useEffect and fetchTeamPlayers function
  useEffect(() => {
    fetchTeamPlayers();
  }, [teamId]);

  const fetchTeamPlayers = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, position, jersey_number')
        .eq('team_id', teamId)
        .order('full_name');

      if (error) throw error;
      setTeamPlayers(data || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
      toast({
        title: "Error",
        description: "Failed to load team players",
        variant: "destructive"
      });
    }
  };

  const compressVideo = async (file: File, videoId?: string): Promise<File> => {
    setIsCompressing(true);
    setCompressionProgress(0);

    // Simulate progress since the service doesn't have a callback
    const progressInterval = setInterval(() => {
      setCompressionProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return newProgress;
      });
    }, 300);

    try {
      const result = await videoCompressionService.compressVideo(
        file, 
        {
          targetSizeMB: 10,
          maxQuality: 'high',
          maintainAspectRatio: true,
          generateThumbnail: true
        },
        videoId
      );

      clearInterval(progressInterval);
      setCompressionProgress(100);

      setCompressionStats({
        originalSize: result.originalSizeMB,
        compressedSize: result.compressedSizeMB,
        ratio: result.compressionRatio
      });

      toast({
        title: "Video Compressed Successfully",
        description: `Reduced from ${result.originalSizeMB.toFixed(1)}MB to ${result.compressedSizeMB.toFixed(1)}MB (${Math.round(result.compressionRatio * 100)}% reduction)`,
      });

      return result.compressedFile;
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Compression error:', error);
      toast({
        title: "Compression Failed",
        description: "Using original file for upload",
        variant: "destructive"
      });
      return file;
    } finally {
      setIsCompressing(false);
    }
  };

  // handleFileSelect, handlePlayerTagsChange, addPlayerTag, removePlayerTag functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid video file",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      
      // Auto-populate title if empty
      if (!metadata.title) {
        setMetadata(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, '')
        }));
      }
    }
  };

  const handlePlayerTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setMetadata(prev => ({ ...prev, playerTags: tags }));
  };

  const addPlayerTag = () => {
    if (!selectedPlayerId) return;

    const player = teamPlayers.find(p => p.id === selectedPlayerId);
    if (!player) return;

    // Check if player already tagged
    if (metadata.playerTags.includes(player.full_name)) {
      toast({
        title: "Player Already Tagged",
        description: `${player.full_name} is already tagged in this video`,
        variant: "destructive"
      });
      return;
    }

    setMetadata(prev => ({
      ...prev,
      playerTags: [...prev.playerTags, player.full_name]
    }));

    setSelectedPlayerId('');
  };

  const removePlayerTag = (playerName: string) => {
    setMetadata(prev => ({
      ...prev,
      playerTags: prev.playerTags.filter(tag => tag !== playerName)
    }));
  };

  const uploadVideo = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    const fileName = `${teamId}/${Date.now()}-${file.name}`;

    try {
      // Create a simple progress simulator since Supabase doesn't support onUploadProgress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 8;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 250);

      const { data, error } = await supabase.storage
        .from('match-videos')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const generateThumbnail = async (file: File): Promise<string> => {
    try {
      const thumbnailBlob = await videoCompressionService.generateThumbnail(file, 10);
      const thumbnailFileName = `thumbnails/${teamId}/${Date.now()}-thumb.jpg`;

      const { data, error } = await supabase.storage
        .from('video-thumbnails')
        .upload(thumbnailFileName, thumbnailBlob);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('video-thumbnails')
        .getPublicUrl(thumbnailFileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return '';
    }
  };

  const performAIAnalysis = async (videoId: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      await aiAnalysisService.analyzeVideo(
        videoId,
        {
          title: metadata.title,
          description: metadata.description,
          videoType: metadata.videoType,
          duration: 1800, // Default 30 minutes
          playerTags: metadata.playerTags,
          matchDetails: metadata.matchDetails
        },
        (progress, status) => {
          setAnalysisProgress(progress);
        }
      );

      // Update video status
      await supabase
        .from('videos')
        .update({ ai_analysis_status: 'completed' })
        .eq('id', videoId);

    } catch (error) {
      console.error('AI analysis error:', error);
      await supabase
        .from('videos')
        .update({ ai_analysis_status: 'failed' })
        .eq('id', videoId);
      
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !metadata.title) {
      toast({
        title: "Missing Information",
        description: "Please select a video file and provide a title",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting video upload process...');
      
      // Step 1: Create video record first to get ID
      const videoData = {
        team_id: teamId,
        title: metadata.title,
        video_url: '', // Will be updated after upload
        thumbnail_url: '', // Will be updated after upload
        video_description: metadata.description || null, // Use video_description column
        video_type: metadata.videoType,
        tagged_players: metadata.playerTags, // Use tagged_players column
        duration: 0,
        file_size: selectedFile.size,
        ai_analysis_status: 'pending',
        compression_status: 'pending', // Use new compression_status column
        ...(metadata.videoType === 'match' && metadata.matchDetails && {
          opposing_team: metadata.matchDetails.opposingTeam,
          match_date: metadata.matchDetails.matchDate,
          league: metadata.matchDetails.league,
          home_or_away: metadata.matchDetails.homeOrAway,
          final_score: metadata.matchDetails.finalScore
        })
      };

      console.log('Inserting video record:', videoData);

      const { data: videoRecord, error: videoError } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

      if (videoError) {
        console.error('Video record creation error:', videoError);
        throw new Error(`Failed to create video record: ${videoError.message}`);
      }

      const videoId = videoRecord.id;
      console.log('Video record created with ID:', videoId);

      // Step 2: Compress video with logging
      const compressedFile = await compressVideo(selectedFile, videoId);

      // Step 3: Generate thumbnail
      const thumbnailUrl = await generateThumbnail(compressedFile);

      // Step 4: Upload video
      const videoUrl = await uploadVideo(compressedFile);

      // Step 5: Update video record with URLs and compression status
      const updateData = {
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        compression_status: 'completed',
        compressed_size_mb: compressedFile.size / (1024 * 1024) // Add compressed size
      };

      console.log('Updating video record:', updateData);

      await supabase
        .from('videos')
        .update(updateData)
        .eq('id', videoId);

      // Step 6: Perform AI analysis
      await performAIAnalysis(videoId);

      toast({
        title: "Upload Complete",
        description: "Video uploaded and analyzed successfully!",
      });

      // Reset form
      setSelectedFile(null);
      setMetadata({
        title: '',
        description: '',
        videoType: 'match',
        playerTags: [],
        matchDetails: {
          opposingTeam: '',
          matchDate: '',
          league: '',
          homeOrAway: 'home',
          finalScore: ''
        }
      });
      setCompressionStats(null);
      setSelectedPlayerId('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.(videoId);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
    }
  };

  const isProcessing = isCompressing || isUploading || isAnalyzing;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-bright-pink" />
          Upload & Analyze Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="video-file" className="text-gray-300">
            Select Video File
          </Label>
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
              disabled={isProcessing}
            />
            {selectedFile && (
              <Badge variant="secondary" className="text-xs">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </Badge>
            )}
          </div>
        </div>

        {/* Compression Status */}
        {isCompressing && (
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Minimize2 className="w-4 h-4 text-bright-pink animate-spin" />
                <span className="text-white font-medium">Compressing Video</span>
              </div>
              <Progress value={compressionProgress} className="h-2" />
              <p className="text-sm text-gray-400 mt-2">
                Optimizing video size to 10MB for faster upload and analysis
              </p>
            </CardContent>
          </Card>
        )}

        {compressionStats && (
          <Card className="bg-green-900/20 border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-white font-medium">Compression Complete</span>
              </div>
              <div className="text-sm text-gray-300">
                Original: {compressionStats.originalSize.toFixed(1)}MB → 
                Compressed: {compressionStats.compressedSize.toFixed(1)}MB 
                ({Math.round((1 - compressionStats.compressedSize / compressionStats.originalSize) * 100)}% reduction)
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">
              Video Title *
            </Label>
            <Input
              id="title"
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter video title..."
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-type" className="text-gray-300">
              Video Type *
            </Label>
            <Select
              value={metadata.videoType}
              onValueChange={(value: 'match' | 'training' | 'interview' | 'highlight') =>
                setMetadata(prev => ({ ...prev, videoType: value }))
              }
              disabled={isProcessing}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Match</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-gray-300">
            Description
          </Label>
          <Textarea
            id="description"
            value={metadata.description}
            onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Provide additional context about this video..."
            className="bg-gray-700 border-gray-600 text-white"
            rows={3}
            disabled={isProcessing}
          />
        </div>

        {/* Player Tags */}
        <div className="space-y-2">
          <Label htmlFor="player-tags" className="text-gray-300 flex items-center gap-1">
            <Users className="w-4 h-4" />
            Tagged Players
          </Label>
          {teamPlayers.length === 0 ? (
            <div className="flex items-center gap-2 p-2 bg-gray-700 border border-gray-600 rounded-md">
              {teamId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-400">Loading team players...</span>
                </>
              ) : (
                <span className="text-sm text-gray-400">No team players found</span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-700 border border-gray-600 rounded-md">
              {metadata.playerTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 bg-bright-pink text-white text-xs"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-white"
                    onClick={() => removePlayerTag(tag)}
                  />
                </Badge>
              ))}
              {teamPlayers.filter(player => !metadata.playerTags.includes(player.full_name)).length > 0 ? (
                <>
                  <Select
                    value={selectedPlayerId}
                    onValueChange={setSelectedPlayerId}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select Player" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamPlayers
                        .filter(player => !metadata.playerTags.includes(player.full_name))
                        .map((player) => (
                          <SelectItem
                            key={player.id}
                            value={player.id}
                          >
                            {player.full_name}
                            {player.jersey_number && ` (${player.jersey_number})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addPlayerTag}
                    disabled={!selectedPlayerId}
                    className="h-8 bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                  >
                    Add Player
                  </Button>
                </>
              ) : (
                <span className="text-sm text-gray-400 italic">
                  All players have been tagged
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Tag players to enable AI to check their presence and analyze their performance
          </p>
        </div>

        {/* Match Details (if match type) */}
        {metadata.videoType === 'match' && (
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-bright-pink" />
                Match Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Opposing Team</Label>
                  <Input
                    value={metadata.matchDetails?.opposingTeam || ''}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      matchDetails: { ...prev.matchDetails!, opposingTeam: e.target.value }
                    }))}
                    placeholder="Enter opposing team name"
                    className="bg-gray-600 border-gray-500 text-white"
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Match Date</Label>
                  <Input
                    type="date"
                    value={metadata.matchDetails?.matchDate || ''}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      matchDetails: { ...prev.matchDetails!, matchDate: e.target.value }
                    }))}
                    className="bg-gray-600 border-gray-500 text-white"
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">League/Competition</Label>
                  <Input
                    value={metadata.matchDetails?.league || ''}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      matchDetails: { ...prev.matchDetails!, league: e.target.value }
                    }))}
                    placeholder="Enter league name"
                    className="bg-gray-600 border-gray-500 text-white"
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Final Score</Label>
                  <Input
                    value={metadata.matchDetails?.finalScore || ''}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      matchDetails: { ...prev.matchDetails!, finalScore: e.target.value }
                    }))}
                    placeholder="e.g., 2-1"
                    className="bg-gray-600 border-gray-500 text-white"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-bright-pink animate-pulse" />
                <span className="text-white font-medium">Uploading Video</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-gray-400 mt-2">
                Uploading to secure cloud storage
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-bright-pink animate-pulse" />
                <span className="text-white font-medium">AI Analysis in Progress</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-gray-400 mt-2">
                Generating comprehensive performance insights and recommendations
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !metadata.title || isProcessing}
          className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze Video
            </>
          )}
        </Button>

        {isProcessing && (
          <div className="text-center text-sm text-gray-400">
            This process may take several minutes depending on video size and complexity
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedVideoUploadForm;
