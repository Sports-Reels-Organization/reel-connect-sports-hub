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
import { Separator } from '@/components/ui/separator';
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
  X,
  FileVideo,
  Clock,
  HardDrive,
  Zap,
  Target,
  Camera,
  PlayCircle,
  Image as ImageIcon,
  Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVideoCompressionService from '@/services/enhancedVideoCompressionService';

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
    venue: string;
  };
}

interface TeamPlayer {
  id: string;
  full_name: string;
  position: string;
  jersey_number?: number;
}

interface ProcessingStatus {
  stage: 'idle' | 'compressing' | 'uploading' | 'complete' | 'error';
  progress: number;
  message: string;
}

interface VideoFileInfo {
  name: string;
  size: number;
  type: string;
  duration?: number;
  dimensions?: { width: number; height: number };
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
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoFileInfo, setVideoFileInfo] = useState<VideoFileInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  });

  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
  } | null>(null);

  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

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
      finalScore: '',
      venue: ''
    }
  });

  const videoCompressionService = new EnhancedVideoCompressionService();

  useEffect(() => {
    fetchTeamPlayers();
  }, [teamId]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  const getVideoFileInfo = async (file: File): Promise<VideoFileInfo> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          duration: Math.round(video.duration),
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight
          }
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        resolve({
          name: file.name,
          size: file.size,
          type: file.type
        });
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file",
        variant: "destructive"
      });
      return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const fileInfo = await getVideoFileInfo(file);
    setVideoFileInfo(fileInfo);

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    // Auto-fill title if empty
    if (!metadata.title) {
      setMetadata(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const updateProcessingStatus = (stage: ProcessingStatus['stage'], progress: number, message: string) => {
    setProcessingStatus({ stage, progress, message });
  };

  const compressVideo = async (file: File, videoId?: string): Promise<File> => {
    updateProcessingStatus('compressing', 0, 'Initializing video compression...');

    const progressInterval = setInterval(() => {
      setProcessingStatus(prev => {
        if (prev.stage !== 'compressing') {
          clearInterval(progressInterval);
          return prev;
        }
        const newProgress = Math.min(prev.progress + Math.random() * 12, 85);
        return {
          ...prev,
          progress: newProgress,
          message: newProgress < 30 ? 'Analyzing video...' :
            newProgress < 60 ? 'Compressing video...' :
              'Finalizing compression...'
        };
      });
    }, 400);

    try {
      const result = await videoCompressionService.compressVideo(
        file,
        {
          targetSizeMB: 25,
          maxQuality: 'high',
          maintainAspectRatio: true,
          generateThumbnail: true
        },
        videoId
      );

      clearInterval(progressInterval);
      updateProcessingStatus('compressing', 100, 'Compression complete!');

      setCompressionStats({
        originalSize: result.originalSizeMB,
        compressedSize: result.compressedSizeMB,
        ratio: result.compressionRatio
      });

      setTimeout(() => {
        toast({
          title: "Video Compressed Successfully",
          description: `Reduced from ${result.originalSizeMB.toFixed(1)}MB to ${result.compressedSizeMB.toFixed(1)}MB`,
        });
      }, 500);

      return result.compressedFile;
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Compression error:', error);
      updateProcessingStatus('error', 0, 'Compression failed. Using original file.');
      return file;
    }
  };

  const uploadVideo = async (file: File): Promise<string> => {
    updateProcessingStatus('uploading', 0, 'Starting upload...');

    const fileName = `${teamId}/${Date.now()}-${file.name}`;

    try {
      const progressInterval = setInterval(() => {
        setProcessingStatus(prev => {
          if (prev.stage !== 'uploading') {
            clearInterval(progressInterval);
            return prev;
          }
          const newProgress = Math.min(prev.progress + 8, 90);
          return {
            ...prev,
            progress: newProgress,
            message: newProgress < 30 ? 'Uploading to cloud storage...' :
              newProgress < 70 ? 'Processing upload...' :
                'Finalizing upload...'
          };
        });
      }, 300);

      const { data, error } = await supabase.storage
        .from('match-videos')
        .upload(fileName, file);

      clearInterval(progressInterval);
      updateProcessingStatus('uploading', 100, 'Upload complete!');

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      updateProcessingStatus('error', 0, 'Upload failed');
      throw error;
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

  const addPlayerTag = () => {
    if (!selectedPlayerId) return;

    const player = teamPlayers.find(p => p.id === selectedPlayerId);
    if (!player) return;

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

  const resetForm = () => {
    setSelectedFile(null);
    setVideoFileInfo(null);
    setPreviewUrl('');
    setCompressionStats(null);
    setSelectedPlayerId('');
    setProcessingStatus({ stage: 'idle', progress: 0, message: '' });
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
        finalScore: '',
        venue: ''
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
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
      // Create video record
      const videoData = {
        team_id: teamId,
        title: metadata.title,
        video_url: '',
        video_type: metadata.videoType,
        duration: videoFileInfo?.duration || 0,
        file_size: selectedFile.size,
        video_description: metadata.description || '',
        tagged_players: metadata.playerTags,
        ...(metadata.videoType === 'match' && metadata.matchDetails && {
          opposing_team: metadata.matchDetails.opposingTeam || '',
          match_date: metadata.matchDetails.matchDate || null,
          home_or_away: metadata.matchDetails.homeOrAway || 'home',
          venue: metadata.matchDetails.venue || '',
          final_score_home: metadata.matchDetails.finalScore ? parseInt(metadata.matchDetails.finalScore.split('-')[0]) || 0 : 0,
          final_score_away: metadata.matchDetails.finalScore ? parseInt(metadata.matchDetails.finalScore.split('-')[1]) || 0 : 0
        })
      };

      const { data: videoRecord, error: videoError } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

      if (videoError) {
        throw new Error(`Failed to create video record: ${videoError.message}`);
      }

      const videoId = videoRecord.id;

      // Process video (compress and upload only)
      const compressedFile = await compressVideo(selectedFile, videoId);
      const [thumbnailUrl, videoUrl] = await Promise.all([
        generateThumbnail(compressedFile),
        uploadVideo(compressedFile)
      ]);

      // Update video record with URLs
      const updateData = {
        video_url: videoUrl,
        ...(thumbnailUrl && { thumbnail_url: thumbnailUrl })
      };

      const { error: updateError } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', videoId);

      if (updateError) {
        throw new Error(`Failed to update video: ${updateError.message}`);
      }

      updateProcessingStatus('complete', 100, 'Upload complete!');

      toast({
        title: "Upload Complete",
        description: "Video uploaded successfully!",
      });

      // Reset form and callback
      setTimeout(() => {
        resetForm();
        onUploadComplete?.(videoId);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      updateProcessingStatus('error', 0, 'Upload failed');
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeVideo = () => {
    toast({
      title: "AI Analysis Coming Soon",
      description: "Video analysis feature will be available in the next update!",
    });
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isProcessing = processingStatus.stage !== 'idle' && processingStatus.stage !== 'complete' && processingStatus.stage !== 'error';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* File Upload Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-bright-pink/20 rounded-lg">
              <Upload className="w-5 h-5 text-bright-pink" />
            </div>
            Upload Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${dragActive
              ? 'border-bright-pink bg-bright-pink/5'
              : selectedFile
                ? 'border-green-500 bg-green-500/5'
                : 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{selectedFile.name}</h3>
                  {videoFileInfo && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <HardDrive className="w-4 h-4" />
                        <span className="text-sm">{formatFileSize(videoFileInfo.size)} MB</span>
                      </div>
                      {videoFileInfo.duration && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{formatDuration(videoFileInfo.duration)}</span>
                        </div>
                      )}
                      {videoFileInfo.dimensions && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Camera className="w-4 h-4" />
                          <span className="text-sm">{videoFileInfo.dimensions.width}x{videoFileInfo.dimensions.height}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-300">
                        <FileVideo className="w-4 h-4" />
                        <span className="text-sm">{videoFileInfo.type.split('/')[1].toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <video
                      ref={videoPreviewRef}
                      src={previewUrl}
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                      controls
                      preload="metadata"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
                <Button
                  onClick={() => resetForm()}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className={`p-4 rounded-full ${dragActive ? 'bg-bright-pink/20' : 'bg-gray-600/50'}`}>
                    <Upload className={`w-12 h-12 ${dragActive ? 'text-bright-pink' : 'text-gray-400'}`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {dragActive ? 'Drop your video here' : 'Upload Video File'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Drag and drop your video file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: MP4, AVI, MOV, WMV | Max size: 100MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-bright-pink text-bright-pink hover:bg-bright-pink hover:text-white"
                  disabled={isProcessing}
                >
                  <FileVideo className="w-4 h-4 mr-2" />
                  Select Video File
                </Button>
              </div>
            )}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {processingStatus.stage === 'compressing' && <Minimize2 className="w-5 h-5 text-bright-pink animate-spin" />}
                    {processingStatus.stage === 'uploading' && <Upload className="w-5 h-5 text-bright-pink animate-pulse" />}
                    <span className="text-white font-medium text-lg">{processingStatus.message}</span>
                  </div>
                  <Progress value={processingStatus.progress} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{processingStatus.stage.charAt(0).toUpperCase() + processingStatus.stage.slice(1)}</span>
                    <span>{Math.round(processingStatus.progress)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compression Stats */}
          {compressionStats && (
            <Card className="bg-green-900/20 border-green-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-white font-medium">Video Optimized Successfully</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">Original</div>
                    <div className="text-white font-medium">{compressionStats.originalSize.toFixed(1)} MB</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Compressed</div>
                    <div className="text-green-400 font-medium">{compressionStats.compressedSize.toFixed(1)} MB</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Reduction</div>
                    <div className="text-bright-pink font-medium">
                      {Math.round((1 - compressionStats.compressedSize / compressionStats.originalSize) * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Video Information Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            Video Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Video Title *
              </Label>
              <Input
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter descriptive video title..."
                className="bg-gray-700 border-gray-600 text-white h-12"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">Video Type *</Label>
              <Select
                value={metadata.videoType}
                onValueChange={(value: 'match' | 'training' | 'interview' | 'highlight') =>
                  setMetadata(prev => ({ ...prev, videoType: value }))
                }
                disabled={isProcessing}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-12">
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
            <Label className="text-gray-300 font-medium">Description</Label>
            <Textarea
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide additional context about this video..."
              className="bg-gray-700 border-gray-600 text-white min-h-24"
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Player Tags */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            Player Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tagged Players Display */}
          {metadata.playerTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Tagged Players:</Label>
              <div className="flex flex-wrap gap-2">
                {metadata.playerTags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="bg-bright-pink text-white px-3 py-1 flex items-center gap-2"
                  >
                    <Users className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => removePlayerTag(tag)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                      disabled={isProcessing}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Player Selection */}
          {teamPlayers.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-gray-400">Loading team players...</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <Select
                value={selectedPlayerId}
                onValueChange={setSelectedPlayerId}
                disabled={isProcessing}
              >
                <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 text-white h-12">
                  <SelectValue placeholder="Select player to tag..." />
                </SelectTrigger>
                <SelectContent>
                  {teamPlayers
                    .filter(player => !metadata.playerTags.includes(player.full_name))
                    .map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        <div className="flex items-center gap-2">
                          <span>{player.full_name}</span>
                          {player.jersey_number && (
                            <Badge variant="outline" className="text-xs">
                              #{player.jersey_number}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">({player.position})</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addPlayerTag}
                disabled={!selectedPlayerId || isProcessing}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white h-12 px-6"
              >
                Add Player
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Tag players featured in this video to enable AI analysis of their performance and presence.
          </p>
        </CardContent>
      </Card>

      {/* Match Details (conditional) */}
      {metadata.videoType === 'match' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">Opposing Team</Label>
                <Input
                  value={metadata.matchDetails?.opposingTeam || ''}
                  onChange={(e) => setMetadata(prev => ({
                    ...prev,
                    matchDetails: { ...prev.matchDetails!, opposingTeam: e.target.value }
                  }))}
                  placeholder="Enter opposing team name..."
                  className="bg-gray-700 border-gray-600 text-white h-12"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">Match Date</Label>
                <Input
                  type="date"
                  value={metadata.matchDetails?.matchDate || ''}
                  onChange={(e) => setMetadata(prev => ({
                    ...prev,
                    matchDetails: { ...prev.matchDetails!, matchDate: e.target.value }
                  }))}
                  className="bg-gray-700 border-gray-600 text-white h-12"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">League/Competition</Label>
                <Input
                  value={metadata.matchDetails?.league || ''}
                  onChange={(e) => setMetadata(prev => ({
                    ...prev,
                    matchDetails: { ...prev.matchDetails!, league: e.target.value }
                  }))}
                  placeholder="Enter league or competition name..."
                  className="bg-gray-700 border-gray-600 text-white h-12"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">Venue</Label>
                <Input
                  value={metadata.matchDetails?.venue || ''}
                  onChange={(e) => setMetadata(prev => ({
                    ...prev,
                    matchDetails: { ...prev.matchDetails!, venue: e.target.value }
                  }))}
                  placeholder="Enter venue name..."
                  className="bg-gray-700 border-gray-600 text-white h-12"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">Home/Away</Label>
                <Select
                  value={metadata.matchDetails?.homeOrAway || 'home'}
                  onValueChange={(value: 'home' | 'away') =>
                    setMetadata(prev => ({
                      ...prev,
                      matchDetails: { ...prev.matchDetails!, homeOrAway: value }
                    }))
                  }
                  disabled={isProcessing}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">Final Score</Label>
                <Input
                  value={metadata.matchDetails?.finalScore || ''}
                  onChange={(e) => setMetadata(prev => ({
                    ...prev,
                    matchDetails: { ...prev.matchDetails!, finalScore: e.target.value }
                  }))}
                  placeholder="e.g., 2-1"
                  className="bg-gray-700 border-gray-600 text-white h-12"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !metadata.title || isProcessing}
          className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white h-14 text-lg font-medium"
          size="lg"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 mr-3" />
          )}
          {isProcessing ? 'Processing Video...' : 'Upload Video'}
        </Button>

        <Button
          onClick={resetForm}
          disabled={isProcessing}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 h-14 px-8"
        >
          Reset Form
        </Button>
      </div>

      {/* AI Analysis Button */}
      {processingStatus.stage === 'complete' && (
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyzeVideo}
            className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg font-medium"
            size="lg"
          >
            <Brain className="w-5 h-5 mr-3" />
            Analyze Video with AI
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="text-center p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <p className="text-gray-300 text-sm">
            Please keep this window open while your video is being processed.
            This may take several minutes depending on video size and complexity.
          </p>
        </div>
      )}

      {processingStatus.stage === 'complete' && (
        <Card className="bg-green-900/20 border-green-700/50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Upload Successful!</h3>
            <p className="text-green-300">
              Your video has been uploaded and is ready for playback and analysis.
            </p>
          </CardContent>
        </Card>
      )}

      {processingStatus.stage === 'error' && (
        <Card className="bg-red-900/20 border-red-700/50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Upload Failed</h3>
            <p className="text-red-300 mb-4">
              {processingStatus.message}
            </p>
            <Button
              onClick={() => setProcessingStatus({ stage: 'idle', progress: 0, message: '' })}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVideoUploadForm;
