
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, Play, FileVideo, Loader2, User, Star, Activity, MessageSquare, Users, Plus, Trash2 } from 'lucide-react';
import { PlayerTagging } from './PlayerTagging';
import { smartCompress } from '@/services/fastVideoCompressionService';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  description?: string;
  matchDate?: string;
  opposingTeam?: string;
  score?: string;
}

interface VideoFile {
  id: string;
  file: File;
  preview: string;
  thumbnail: string;
  duration: number;
  compressed?: boolean;
  compressedSize?: number;
}

export const EnhancedVideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess, onCancel }) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    matchDate: '',
    opposingTeam: '',
    score: '',
  });
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoType, setVideoType] = useState<'match' | 'interview' | 'training' | 'highlight'>('match');
  const [isCompressing, setIsCompressing] = useState(false);

  // Generate thumbnail from video
  const generateThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        canvas.width = 320;
        canvas.height = 180;
        video.currentTime = Math.min(5, video.duration * 0.1); // Get frame at 5s or 10% of video
      };
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Get video duration
  const getVideoDuration = (videoFile: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Compress video to target size (10MB)
  const compressVideo = async (file: File): Promise<File> => {
    setIsCompressing(true);
    setCompressionProgress(0);
    
    try {
      // Target size: 10MB
      const targetSizeMB = 10;
      const targetSizeBytes = targetSizeMB * 1024 * 1024;
      
      if (file.size <= targetSizeBytes) {
        setIsCompressing(false);
        return file;
      }

      const compressionRatio = targetSizeBytes / file.size;
      const quality = Math.max(0.3, Math.min(0.9, compressionRatio * 1.2));

      setCompressionProgress(25);
      
      const compressedFile = await smartCompress(file, {
        quality,
        maxSizeMB: targetSizeMB,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (progress: number) => {
          setCompressionProgress(25 + (progress * 0.75));
        }
      });

      setCompressionProgress(100);
      setIsCompressing(false);
      
      console.log(`Compressed video from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      return compressedFile;
    } catch (error) {
      console.error('Compression failed:', error);
      setIsCompressing(false);
      // If compression fails, return original file if under 50MB
      if (file.size <= 50 * 1024 * 1024) {
        return file;
      }
      throw new Error('Video file is too large and compression failed');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      try {
        toast({
          title: "Processing Video",
          description: `Processing ${file.name}...`,
        });

        // Get video duration and thumbnail
        const [duration, thumbnail] = await Promise.all([
          getVideoDuration(file),
          generateThumbnail(file)
        ]);

        // Compress video if needed
        const compressedFile = await compressVideo(file);
        
        const videoFile: VideoFile = {
          id: Math.random().toString(36).substring(7),
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile),
          thumbnail,
          duration,
          compressed: compressedFile !== file,
          compressedSize: compressedFile.size
        };

        setVideoFiles(prev => [...prev, videoFile]);
        
        toast({
          title: "Video Ready",
          description: `${file.name} processed successfully!`,
        });
      } catch (error) {
        console.error('Error processing video:', error);
        toast({
          title: "Error",
          description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeVideoFile = (id: string) => {
    setVideoFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const uploadSingleVideo = async (videoFile: VideoFile, teamId: string) => {
    const fileExt = videoFile.file.name.split('.').pop();
    const fileName = `${Date.now()}_${videoFile.id}.${fileExt}`;
    const filePath = `${teamId}/${fileName}`;

    // Upload video file
    const { error: uploadError } = await supabase.storage
      .from('match-videos')
      .upload(filePath, videoFile.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Upload thumbnail
    const thumbnailBlob = await (await fetch(videoFile.thumbnail)).blob();
    const thumbnailPath = `${teamId}/thumbnails/${fileName.replace(/\.[^/.]+$/, '')}.jpg`;
    
    const { error: thumbnailError } = await supabase.storage
      .from('video-thumbnails')
      .upload(thumbnailPath, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (thumbnailError) {
      console.warn('Thumbnail upload failed:', thumbnailError);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('match-videos')
      .getPublicUrl(filePath);

    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('video-thumbnails')
      .getPublicUrl(thumbnailPath);

    // Prepare video metadata for better AI analysis
    const videoData = {
      team_id: teamId,
      title: videoFiles.length > 1 ? `${formData.title} - Part ${videoFiles.indexOf(videoFile) + 1}` : formData.title,
      description: formData.description || null,
      video_url: publicUrl,
      thumbnail_url: !thumbnailError ? thumbnailUrl : null,
      duration: Math.floor(videoFile.duration),
      tagged_players: taggedPlayers,
      match_date: formData.matchDate && formData.matchDate.trim() !== '' ? formData.matchDate : null,
      opposing_team: formData.opposingTeam || null,
      score: formData.score || null,
      file_size: videoFile.file.size,
      ai_analysis_status: 'pending',
      upload_status: 'completed',
      tags: [videoType],
      ai_analysis: {
        video_type: videoType,
        metadata: {
          playerTags: taggedPlayers,
          videoTitle: videoFiles.length > 1 ? `${formData.title} - Part ${videoFiles.indexOf(videoFile) + 1}` : formData.title,
          videoDescription: formData.description,
          matchDetails: videoType === 'match' ? {
            opposingTeam: formData.opposingTeam,
            matchDate: formData.matchDate,
            finalScore: formData.score
          } : undefined,
          duration: Math.floor(videoFile.duration),
          uploadedAt: new Date().toISOString(),
          originalFileName: videoFile.file.name,
          compressed: videoFile.compressed,
          compressedSize: videoFile.compressedSize
        }
      }
    };

    const { data: newVideoData, error: insertError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Trigger AI analysis with proper video context
    try {
      const { error: analysisError } = await supabase.functions
        .invoke('analyze-video', {
          body: {
            videoId: newVideoData.id,
            videoUrl: publicUrl,
            videoType: videoType,
            videoTitle: videoData.title,
            videoDescription: formData.description,
            opposingTeam: formData.opposingTeam,
            playerStats: {}, // Add any player stats if available
            taggedPlayers: taggedPlayers.map(playerId => {
              // Get player details for better analysis
              return {
                playerId,
                playerName: `Player ${playerId}`, // This should be enhanced with actual player names
                jerseyNumber: Math.floor(Math.random() * 99) + 1 // This should come from actual data
              };
            })
          }
        });

      if (analysisError) {
        console.error('AI analysis trigger failed:', analysisError);
      }
    } catch (error) {
      console.error('Failed to trigger AI analysis:', error);
    }

    return newVideoData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (videoFiles.length === 0 || !profile?.id) {
      toast({
        title: "Error",
        description: "Please select at least one video file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    if (taggedPlayers.length === 0) {
      toast({
        title: "Warning",
        description: "No players tagged. Consider adding player tags for better AI analysis.",
      });
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) {
        throw new Error('Team not found');
      }

      const uploadedVideos = [];
      const totalVideos = videoFiles.length;

      for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i];
        setUploadProgress((i / totalVideos) * 90);
        
        try {
          const uploadedVideo = await uploadSingleVideo(videoFile, teamData.id);
          uploadedVideos.push(uploadedVideo);
        } catch (error) {
          console.error(`Failed to upload video ${i + 1}:`, error);
          toast({
            title: "Upload Error",
            description: `Failed to upload video ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }

      setUploadProgress(100);

      if (uploadedVideos.length > 0) {
        toast({
          title: "Upload Successful",
          description: `${uploadedVideos.length} ${videoType} video(s) uploaded successfully! AI analysis will begin shortly.`,
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('No videos were uploaded successfully');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      videoFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white font-polysans flex items-center gap-2">
          <Upload className="w-6 h-6 text-bright-pink" />
          Upload Video{videoFiles.length > 1 ? 's' : ''}
        </CardTitle>
        <p className="text-gray-400">
          Upload your video(s) and select the type for AI-powered analysis. Videos will be compressed to 10MB automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="video-type" className="text-white font-medium">
              Video Type <span className="text-red-500">*</span>
            </Label>
            <Select value={videoType} onValueChange={(value: any) => setVideoType(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select video type for AI analysis" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="match">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Match Video</div>
                      <div className="text-xs text-gray-400">Full match or game footage</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="highlight">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Highlight Reel</div>
                      <div className="text-xs text-gray-400">Best moments and skills compilation</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="training">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Training Session</div>
                      <div className="text-xs text-gray-400">Practice and skill development footage</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="interview">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Player Interview</div>
                      <div className="text-xs text-gray-400">Spoken content and communications</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-white font-medium">
              Video Files <span className="text-red-500">*</span>
            </Label>
            
            {/* Compression Progress */}
            {isCompressing && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin text-bright-pink" />
                  <span className="text-white text-sm">Compressing video...</span>
                </div>
                <Progress value={compressionProgress} className="w-full" />
                <p className="text-xs text-gray-400 mt-1">{compressionProgress.toFixed(0)}% complete</p>
              </div>
            )}

            {/* Video Previews */}
            {videoFiles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {videoFiles.map((videoFile) => (
                  <div key={videoFile.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm truncate">{videoFile.file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVideoFile(videoFile.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Thumbnail Preview */}
                    <div className="relative mb-2">
                      <img 
                        src={videoFile.thumbnail} 
                        alt="Video thumbnail"
                        className="w-full h-32 object-cover rounded bg-black"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Duration: {Math.floor(videoFile.duration / 60)}:{(videoFile.duration % 60).toString().padStart(2, '0')}</div>
                      <div>Size: {formatFileSize(videoFile.file.size)}</div>
                      {videoFile.compressed && (
                        <div className="text-green-400">✓ Compressed to fit 10MB limit</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Video Button */}
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-bright-pink transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-8 h-8 text-gray-500" />
                <p className="text-gray-300">
                  {videoFiles.length === 0 ? 'Click to select your first video' : 'Add another video (optional)'}
                </p>
                <p className="text-sm text-gray-500">MP4, AVI, MOV files will be compressed to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter video title"
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-medium">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what happens in the video for better AI analysis"
              className="bg-gray-700 border-gray-600 text-white resize-none"
              rows={3}
            />
          </div>

          {videoType === 'match' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="matchDate" className="text-white font-medium">Match Date</Label>
                <Input
                  type="date"
                  id="matchDate"
                  name="matchDate"
                  value={formData.matchDate || ''}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposingTeam" className="text-white font-medium">Opposing Team</Label>
                <Input
                  type="text"
                  id="opposingTeam"
                  name="opposingTeam"
                  value={formData.opposingTeam || ''}
                  onChange={handleInputChange}
                  placeholder="Enter opposing team name for accurate analysis"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score" className="text-white font-medium">Score</Label>
                <Input
                  type="text"
                  id="score"
                  name="score"
                  value={formData.score || ''}
                  onChange={handleInputChange}
                  placeholder="Enter final score (e.g., 2-1)"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-white font-medium">Tag Players</Label>
            <PlayerTagging 
              selectedPlayers={taggedPlayers}
              onPlayersChange={setTaggedPlayers}
            />
            <p className="text-xs text-gray-400">Tag players in the video for more accurate AI analysis</p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Uploading videos...</span>
                <span className="text-gray-300">{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isUploading || isCompressing}
              className="flex-1 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={videoFiles.length === 0 || isUploading || isCompressing}
              className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading {videoFiles.length} video{videoFiles.length > 1 ? 's' : ''}... ({uploadProgress.toFixed(0)}%)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {videoFiles.length} {videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video{videoFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
