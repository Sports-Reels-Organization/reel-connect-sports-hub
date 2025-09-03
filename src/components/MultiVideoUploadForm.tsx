import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  X,
  FileVideo,
  Clock,
  HardDrive,
  Zap,
  Target,
  Camera,
  PlayCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  EyeOff
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
    homeScore: string;
    awayScore: string;
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

interface VideoUploadItem {
  id: string;
  file: File;
  fileInfo: VideoFileInfo & { thumbnailUrl?: string };
  previewUrl: string;
  metadata: VideoMetadata;
  processingStatus: ProcessingStatus;
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    ratio: number;
  };
  isExpanded: boolean;
  uploadedVideoId?: string;
}

interface MultiVideoUploadFormProps {
  teamId: string;
  onUploadComplete?: (videoIds: string[]) => void;
  onCancel?: () => void;
}

const MultiVideoUploadForm: React.FC<MultiVideoUploadFormProps> = ({
  teamId,
  onUploadComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoCompressionService = new EnhancedVideoCompressionService();
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const [videoItems, setVideoItems] = useState<VideoUploadItem[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());

  const MAX_VIDEOS = 6;
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  useEffect(() => {
    fetchTeamPlayers();
  }, [teamId]);

  useEffect(() => {
    return () => {
      // Clean up all blob URLs on component unmount
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []); // Empty dependency array - only run on unmount

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
        description: "Failed to fetch team players",
        variant: "destructive"
      });
    }
  };

  const getVideoFileInfo = async (file: File, blobUrl: string): Promise<VideoFileInfo & { thumbnailUrl?: string }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = blobUrl;

      video.onloadedmetadata = () => {
        // Generate thumbnail using canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        let thumbnailUrl: string | undefined;
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        }

        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          duration: Math.round(video.duration),
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight
          },
          thumbnailUrl
        });
        // ✅ Don't revoke blob URL here - it's used for preview
      };

      video.onerror = () => {
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          duration: 0,
          dimensions: { width: 0, height: 0 }
        });
        // ✅ Don't revoke blob URL here either
      };
    });
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (files: FileList) => {
    const newFiles = Array.from(files).slice(0, MAX_VIDEOS - videoItems.length);

    for (const file of newFiles) {
      if (!validateFile(file)) continue;

      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add to loading state
      setLoadingVideos(prev => new Set(prev).add(videoId));

      try {
        // Create blob URL first
        const previewUrl = URL.createObjectURL(file);
        blobUrlsRef.current.add(previewUrl); // Track the blob URL
        
        // Get file info and thumbnail using the same blob URL
        const fileInfo = await getVideoFileInfo(file, previewUrl);

        const newVideoItem: VideoUploadItem = {
          id: videoId,
          file,
          fileInfo,
          previewUrl,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: '',
            videoType: 'match',
            playerTags: [],
            matchDetails: {
              opposingTeam: '',
              matchDate: '',
              league: '',
              homeOrAway: 'home',
              homeScore: '',
              awayScore: '',
              venue: ''
            }
          },
          processingStatus: {
            stage: 'idle',
            progress: 0,
            message: ''
          },
          isExpanded: false
        };

        setVideoItems(prev => [...prev, newVideoItem]);
      } catch (error) {
        console.error('Error processing video file:', error);
        toast({
          title: "Error Processing Video",
          description: `Failed to process ${file.name}`,
          variant: "destructive"
        });
      } finally {
        // Remove from loading state
        setLoadingVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      }
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileSelect(files);
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

    const files = e.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const removeVideoItem = (id: string) => {
    setVideoItems(prev => {
      const item = prev.find(v => v.id === id);
      if (item?.previewUrl) {
        // Clean up the blob URL immediately when removing
        URL.revokeObjectURL(item.previewUrl);
        blobUrlsRef.current.delete(item.previewUrl);
      }
      return prev.filter(v => v.id !== id);
    });
  };

  const updateVideoMetadata = (id: string, updates: Partial<VideoMetadata>) => {
    setVideoItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, metadata: { ...item.metadata, ...updates } }
        : item
    ));
  };

  const toggleVideoExpanded = (id: string) => {
    setVideoItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, isExpanded: !item.isExpanded }
        : item
    ));
  };

  const updateProcessingStatus = (id: string, stage: ProcessingStatus['stage'], progress: number, message: string) => {
    setVideoItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, processingStatus: { stage, progress, message } }
        : item
    ));
  };

  const updateCompressionStats = (id: string, stats: { originalSize: number; compressedSize: number; ratio: number }) => {
    setVideoItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, compressionStats: stats }
        : item
    ));
  };

  const setUploadedVideoId = (id: string, videoId: string) => {
    setVideoItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, uploadedVideoId: videoId }
        : item
    ));
  };

  const sanitizeFileName = (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const uploadSingleVideo = async (videoItem: VideoUploadItem): Promise<string | null> => {
    const { file, metadata, id } = videoItem;

    try {
      // Step 1: Compress video
      updateProcessingStatus(id, 'compressing', 0, 'Compressing video...');

      const compressionResult = await videoCompressionService.compressVideo(
        file,
        {
          targetSizeMB: 10,
          maxQuality: 'high',
          maintainAspectRatio: true,
          generateThumbnail: true
        }
      );

      const compressionStats = {
        originalSize: compressionResult.originalSizeMB * 1024 * 1024,
        compressedSize: compressionResult.compressedSizeMB * 1024 * 1024,
        ratio: Math.round(compressionResult.compressionRatio * 100)
      };

      updateCompressionStats(id, compressionStats);

      // Step 2: Upload to storage
      updateProcessingStatus(id, 'uploading', 70, 'Uploading to storage...');

      const fileName = `${sanitizeFileName(metadata.title)}_${Date.now()}.mp4`;
      const filePath = `sportsreelsvideos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(filePath, compressionResult.compressedFile, {
          contentType: 'video/mp4',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Step 3: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(filePath);

      // Step 4: Save to database
      updateProcessingStatus(id, 'uploading', 90, 'Saving video metadata...');

      // Format score for database (combine home and away scores)
      const formattedScore = metadata.matchDetails?.homeScore && metadata.matchDetails?.awayScore
        ? `${metadata.matchDetails.homeScore}-${metadata.matchDetails.awayScore}`
        : null;

      // Safely parse scores to integers
      const homeScore = metadata.matchDetails?.homeScore ?
        parseInt(metadata.matchDetails.homeScore, 10) : null;
      const awayScore = metadata.matchDetails?.awayScore ?
        parseInt(metadata.matchDetails.awayScore, 10) : null;

      // Validate that parsed scores are valid numbers
      const validHomeScore = homeScore && !isNaN(homeScore) ? homeScore : null;
      const validAwayScore = awayScore && !isNaN(awayScore) ? awayScore : null;

      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          team_id: teamId,
          title: metadata.title,
          description: metadata.description,
          video_url: publicUrl,
          video_type: metadata.videoType,
          tagged_players: metadata.playerTags, // Use 'tagged_players' (JSONB column)
          opposing_team: metadata.matchDetails?.opposingTeam,
          match_date: metadata.matchDetails?.matchDate,
          score: formattedScore, // Combined score for display
          final_score_home: validHomeScore,
          final_score_away: validAwayScore,
          home_or_away: metadata.matchDetails?.homeOrAway,
          file_size: compressionResult.compressedSizeMB * 1024 * 1024,
          duration: Math.round(videoItem.fileInfo.duration || 0), // Convert decimal seconds to integer, default to 0 if undefined
          is_public: true
        })
        .select()
        .single();

      if (dbError) throw dbError;

      updateProcessingStatus(id, 'complete', 100, 'Upload complete!');
      setUploadedVideoId(id, videoData.id);

      return videoData.id;

    } catch (error) {
      console.error('Error uploading video:', error);
      updateProcessingStatus(id, 'error', 0, `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const handleUploadAll = async () => {
    if (videoItems.length === 0) {
      toast({
        title: "No Videos Selected",
        description: "Please select at least one video to upload",
        variant: "destructive"
      });
      return;
    }

    // Validate all videos before upload
    const validation = validateAllVideos();
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).flat();
      toast({
        title: "Validation Error",
        description: `Please complete all required fields: ${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? '...' : ''}`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setOverallProgress(0);

    const uploadedVideoIds: string[] = [];

    try {
      for (let i = 0; i < videoItems.length; i++) {
        const videoItem = videoItems[i];
        setOverallProgress((i / videoItems.length) * 100);

        const videoId = await uploadSingleVideo(videoItem);
        if (videoId) {
          uploadedVideoIds.push(videoId);
        }

        // Small delay between uploads to prevent overwhelming the server
        if (i < videoItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setOverallProgress(100);

      if (uploadedVideoIds.length > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${uploadedVideoIds.length} video(s)`,
        });

        // Clean up all blob URLs after successful upload
        blobUrlsRef.current.forEach(url => {
          URL.revokeObjectURL(url);
        });
        blobUrlsRef.current.clear();

        if (onUploadComplete) {
          onUploadComplete(uploadedVideoIds);
        }
      } else {
        toast({
          title: "Upload Failed",
          description: "No videos were successfully uploaded",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error in batch upload:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred during the upload process",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateVideoItem = (videoItem: VideoUploadItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check required fields
    if (!videoItem.metadata.title.trim()) {
      errors.push('Title is required');
    }

    if (!videoItem.metadata.description.trim()) {
      errors.push('Description is required');
    }

    // Check match details if video type is match
    if (videoItem.metadata.videoType === 'match') {
      const matchDetails = videoItem.metadata.matchDetails;
      if (!matchDetails?.opposingTeam.trim()) {
        errors.push('Opposing team is required for match videos');
      }
      if (!matchDetails?.matchDate) {
        errors.push('Match date is required for match videos');
      }
      if (!matchDetails?.league.trim()) {
        errors.push('League is required for match videos');
      }
      if (!matchDetails?.homeScore.trim()) {
        errors.push('Home score is required for match videos');
      }
      if (!matchDetails?.awayScore.trim()) {
        errors.push('Away score is required for match videos');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateAllVideos = (): { isValid: boolean; errors: { [videoId: string]: string[] } } => {
    const allErrors: { [videoId: string]: string[] } = {};
    let allValid = true;

    videoItems.forEach(videoItem => {
      const validation = validateVideoItem(videoItem);
      if (!validation.isValid) {
        allValid = false;
        allErrors[videoItem.id] = validation.errors;
      }
    });

    return {
      isValid: allValid,
      errors: allErrors
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Multiple Videos</h2>
          <p className="text-gray-400">Upload up to 6 videos with individual settings</p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleUploadAll}
            disabled={videoItems.length === 0 || isUploading}
            className="bg-rosegold hover:bg-rosegold/90 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload All ({videoItems.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      {isUploading && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white">Overall Progress</span>
                <span className="text-gray-400">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Drop Zone */}
      {videoItems.length < MAX_VIDEOS && (
        <Card
          className={`border-2 border-dashed transition-colors ${dragActive
            ? 'border-rosegold bg-rosegold/10'
            : 'border-gray-600 hover:border-gray-500'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Drop videos here or click to browse
            </h3>
            <p className="text-gray-400 mb-4">
              Select up to {MAX_VIDEOS - videoItems.length} more video(s) (Max 100MB each)
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="text-white border-gray-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Videos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Video Items */}
      <div className="space-y-4">
        {videoItems.map((videoItem, index) => (
          <Card key={videoItem.id} className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rosegold/20 rounded-lg flex items-center justify-center">
                    <span className="text-rosegold font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{videoItem.metadata.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileVideo className="w-4 h-4" />
                        {formatFileSize(videoItem.fileInfo.size)}
                      </span>
                      {videoItem.fileInfo.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(videoItem.fileInfo.duration)}
                        </span>
                      )}
                      {videoItem.compressionStats && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {videoItem.compressionStats.ratio}% smaller
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Validation Status */}
                  {(() => {
                    const validation = validateVideoItem(videoItem);
                    return validation.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    );
                  })()}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVideoExpanded(videoItem.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    {videoItem.isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVideoItem(videoItem.id)}
                    disabled={isUploading}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Processing Status */}
            {videoItem.processingStatus.stage !== 'idle' && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {videoItem.processingStatus.stage === 'compressing' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    )}
                    {videoItem.processingStatus.stage === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    )}
                    {videoItem.processingStatus.stage === 'complete' && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    {videoItem.processingStatus.stage === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-white text-sm">{videoItem.processingStatus.message}</span>
                  </div>
                  <Progress value={videoItem.processingStatus.progress} className="h-2" />
                </div>
              </CardContent>
            )}

            {/* Expanded Content */}
            {videoItem.isExpanded && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Video Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Preview</Label>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400">
                          {videoItem.fileInfo.dimensions && (
                            <span>{videoItem.fileInfo.dimensions.width}×{videoItem.fileInfo.dimensions.height}</span>
                          )}
                          {videoItem.fileInfo.duration && (
                            <span className="ml-2">{formatDuration(videoItem.fileInfo.duration)}</span>
                          )}
                        </div>

                      </div>
                    </div>
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      {loadingVideos.has(videoItem.id) ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p>Processing video...</p>
                          </div>
                        </div>
                      ) : videoItem.previewUrl ? (
                                                  <video
                            key={videoItem.id}
                            src={videoItem.previewUrl}
                            controls
                            className="w-full h-48 object-cover"
                            preload="metadata"
                            playsInline
                            muted
                            poster={videoItem.fileInfo.thumbnailUrl}
                            onError={(e) => {
                              console.error('Video preview error:', e);
                              toast({
                                title: "Video Preview Error",
                                description: `Could not load preview for ${videoItem.metadata.title}. The video file may be corrupted or in an unsupported format.`,
                                variant: "destructive"
                              });
                            }}
                            style={{ backgroundColor: '#000' }}
                          >
                            Your browser does not support the video tag.
                          </video>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p>Loading preview...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video Settings */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`title-${videoItem.id}`} className="text-white">Title *</Label>
                      <Input
                        id={`title-${videoItem.id}`}
                        value={videoItem.metadata.title}
                        onChange={(e) => updateVideoMetadata(videoItem.id, { title: e.target.value })}
                        className={`bg-gray-700 text-white border-gray-600 ${!videoItem.metadata.title.trim() ? 'border-red-500' : ''}`}
                        placeholder="Enter video title"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`description-${videoItem.id}`} className="text-white">Description *</Label>
                      <Textarea
                        id={`description-${videoItem.id}`}
                        value={videoItem.metadata.description}
                        onChange={(e) => updateVideoMetadata(videoItem.id, { description: e.target.value })}
                        className={`bg-gray-700 text-white border-gray-600 ${!videoItem.metadata.description.trim() ? 'border-red-500' : ''}`}
                        placeholder="Enter video description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`type-${videoItem.id}`} className="text-white">Video Type</Label>
                      <Select
                        value={videoItem.metadata.videoType}
                        onValueChange={(value: 'match' | 'training' | 'interview' | 'highlight') =>
                          updateVideoMetadata(videoItem.id, { videoType: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-700 text-white border-gray-600">
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

                    {/* Player Tags */}
                    <div>
                      <Label className="text-white">Tag Players</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                        {teamPlayers.map((player) => (
                          <div key={player.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`player-${videoItem.id}-${player.id}`}
                              checked={videoItem.metadata.playerTags.includes(player.id)}
                              onCheckedChange={(checked) => {
                                const newTags = checked
                                  ? [...videoItem.metadata.playerTags, player.id]
                                  : videoItem.metadata.playerTags.filter(id => id !== player.id);
                                updateVideoMetadata(videoItem.id, { playerTags: newTags });
                              }}
                            />
                            <label
                              htmlFor={`player-${videoItem.id}-${player.id}`}
                              className="text-sm text-white cursor-pointer"
                            >
                              {player.full_name} ({player.position})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Match Details (if video type is match) */}
                    {videoItem.metadata.videoType === 'match' && (
                      <div className="space-y-3">
                        <Label className="text-white">Match Details</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`opposing-${videoItem.id}`} className="text-white text-sm">Opposing Team *</Label>
                            <Input
                              id={`opposing-${videoItem.id}`}
                              value={videoItem.metadata.matchDetails?.opposingTeam || ''}
                              onChange={(e) => updateVideoMetadata(videoItem.id, {
                                matchDetails: { ...videoItem.metadata.matchDetails!, opposingTeam: e.target.value }
                              })}
                              className={`bg-gray-700 text-white border-gray-600 ${!videoItem.metadata.matchDetails?.opposingTeam.trim() ? 'border-red-500' : ''}`}
                              placeholder="Team name"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`date-${videoItem.id}`} className="text-white text-sm">Match Date *</Label>
                            <Input
                              id={`date-${videoItem.id}`}
                              type="date"
                              value={videoItem.metadata.matchDetails?.matchDate || ''}
                              onChange={(e) => updateVideoMetadata(videoItem.id, {
                                matchDetails: { ...videoItem.metadata.matchDetails!, matchDate: e.target.value }
                              })}
                              className={`bg-gray-700 text-white border-gray-600 ${!videoItem.metadata.matchDetails?.matchDate ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`league-${videoItem.id}`} className="text-white text-sm">League *</Label>
                            <Input
                              id={`league-${videoItem.id}`}
                              value={videoItem.metadata.matchDetails?.league || ''}
                              onChange={(e) => updateVideoMetadata(videoItem.id, {
                                matchDetails: { ...videoItem.metadata.matchDetails!, league: e.target.value }
                              })}
                              className={`bg-gray-700 text-white border-gray-600 ${!videoItem.metadata.matchDetails?.league.trim() ? 'border-red-500' : ''}`}
                              placeholder="League name"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`home-score-${videoItem.id}`} className="text-white text-sm">Home Score *</Label>
                            <Input
                              id={`home-score-${videoItem.id}`}
                              type="number"
                              min="0"
                              value={videoItem.metadata.matchDetails?.homeScore || ''}
                              onChange={(e) => updateVideoMetadata(videoItem.id, {
                                matchDetails: { ...videoItem.metadata.matchDetails!, homeScore: e.target.value }
                              })}
                              className={`bg-gray-700 text-white border-gray-600 ${!videoItem.metadata.matchDetails?.homeScore.trim() ? 'border-red-500' : ''}`}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`away-score-${videoItem.id}`} className="text-white text-sm">Away Score *</Label>
                            <Input
                              id={`away-score-${videoItem.id}`}
                              type="number"
                              min="0"
                              value={videoItem.metadata.matchDetails?.awayScore || ''}
                              onChange={(e) => updateVideoMetadata(videoItem.id, {
                                matchDetails: { ...videoItem.metadata.matchDetails!, awayScore: e.target.value }
                              })}
                              className={`bg-gray-700 text-white border-gray-600 ${!videoItem.metadata.matchDetails?.awayScore.trim() ? 'border-red-500' : ''}`}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Summary */}
      {videoItems.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <span className="font-semibold">{videoItems.length}</span> video(s) ready to upload
              </div>
              <div className="text-gray-400 text-sm">
                Total size: {formatFileSize(videoItems.reduce((sum, item) => sum + item.fileInfo.size, 0))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiVideoUploadForm;
