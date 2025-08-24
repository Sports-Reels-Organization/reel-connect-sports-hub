
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
import { Upload, X, Play, FileVideo, Loader2, User, Plus } from 'lucide-react';
import { PlayerTagging } from './PlayerTagging';
import { smartCompress } from '@/services/fastVideoCompressionService';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface VideoFile {
  file: File;
  thumbnail: string;
  id: string;
}

export const EnhancedVideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoType: 'match' as 'match' | 'training' | 'highlight' | 'interview',
    teamId: '',
    opposingTeam: '',
    matchDate: '',
    score: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setTeams(data);
    }
  };

  const generateThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      video.onloadedmetadata = () => {
        canvas.width = 320;
        canvas.height = 180;
        video.currentTime = Math.min(5, video.duration * 0.1);
      };
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      };

      const url = URL.createObjectURL(file);
      video.src = url;
      video.load();
    });
  };

  const compressVideo = async (file: File): Promise<File> => {
    const targetSizeMB = 10;
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    
    if (file.size <= targetSizeBytes) {
      return file;
    }

    setIsCompressing(true);
    setCompressionProgress(0);
    
    try {
      const compressionRatio = targetSizeBytes / file.size;
      const quality = Math.max(0.1, Math.min(0.9, compressionRatio * 0.8));

      setCompressionProgress(25);
      
      const compressedFile = await smartCompress(file, {
        quality,
        maxSizeMB: targetSizeMB,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        onProgress: (progress: number) => {
          setCompressionProgress(25 + (progress * 0.75));
        },
      });

      setCompressionProgress(100);
      
      console.log(`Compressed video from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      return compressedFile;
    } catch (error) {
      console.error('Compression failed:', error);
      throw new Error('Video compression failed. Please try a smaller file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files).filter(file => 
      file.type.startsWith('video/') && file.size <= 100 * 1024 * 1024 // 100MB limit before compression
    );

    if (selectedFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please select valid video files (max 100MB each)",
        variant: "destructive"
      });
      return;
    }

    try {
      const processedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const thumbnail = await generateThumbnail(file);
          return {
            file,
            thumbnail,
            id: crypto.randomUUID()
          };
        })
      );

      setVideoFiles(prev => [...prev, ...processedFiles]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Error processing files",
        description: "Failed to generate thumbnails for some videos",
        variant: "destructive"
      });
    }
  };

  const removeVideo = (id: string) => {
    setVideoFiles(prev => prev.filter(v => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || videoFiles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select at least one video and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for your video(s)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalVideos = videoFiles.length;
      let completedVideos = 0;

      for (const videoFile of videoFiles) {
        await uploadSingleVideo(videoFile, completedVideos, totalVideos);
        completedVideos++;
        setUploadProgress((completedVideos / totalVideos) * 100);
      }

      toast({
        title: "Upload successful",
        description: `${totalVideos} video(s) uploaded and analysis started`,
      });

      // Reset form
      setVideoFiles([]);
      setFormData({
        title: '',
        description: '',
        videoType: 'match',
        teamId: '',
        opposingTeam: '',
        matchDate: '',
        score: ''
      });
      setTaggedPlayers([]);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadSingleVideo = async (videoFile: VideoFile, index: number, total: number) => {
    // Compress video
    const compressedFile = await compressVideo(videoFile.file);
    
    const teamId = formData.teamId || user?.id;
    if (!teamId) throw new Error('Team ID is required');

    // Upload compressed video
    const videoFileName = `${Date.now()}_${index}.${compressedFile.name.split('.').pop()}`;
    const videoPath = `${teamId}/${videoFileName}`;

    const { error: videoUploadError } = await supabase.storage
      .from('match-videos')
      .upload(videoPath, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (videoUploadError) throw videoUploadError;

    // Upload thumbnail
    const thumbnailBlob = await fetch(videoFile.thumbnail).then(r => r.blob());
    const thumbnailFileName = `${Date.now()}_${index}_thumb.jpg`;
    const thumbnailPath = `${teamId}/${thumbnailFileName}`;

    const { error: thumbnailUploadError } = await supabase.storage
      .from('video-thumbnails')
      .upload(thumbnailPath, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (thumbnailUploadError) throw thumbnailUploadError;

    // Get public URLs
    const { data: videoUrl } = supabase.storage
      .from('match-videos')
      .getPublicUrl(videoPath);

    const { data: thumbnailUrl } = supabase.storage
      .from('video-thumbnails')
      .getPublicUrl(thumbnailPath);

    // Prepare video metadata for AI analysis
    const videoData = {
      team_id: teamId,
      title: videoFiles.length > 1 ? `${formData.title} - Part ${videoFiles.indexOf(videoFile) + 1}` : formData.title,
      description: formData.description,
      video_url: videoUrl.publicUrl,
      thumbnail_url: thumbnailUrl.publicUrl,
      video_type: formData.videoType,
      upload_date: new Date().toISOString(),
      file_size: compressedFile.size,
      duration: 0, // Will be updated after video processing
      tagged_players: taggedPlayers,
      ai_analysis_status: 'pending',
      metadata: {
        opposingTeam: formData.opposingTeam,
        matchDate: formData.matchDate,
        score: formData.score,
        originalFileName: videoFile.file.name,
        compressedSize: compressedFile.size,
        originalSize: videoFile.file.size
      }
    };

    // Insert video record
    const { data: videoRecord, error: insertError } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();

    if (insertError) throw insertError;

    // Trigger enhanced AI analysis
    try {
      const { error: analysisError } = await supabase.functions
        .invoke('analyze-video', {
          body: {
            videoId: videoRecord.id,
            videoUrl: videoUrl.publicUrl,
            videoType: formData.videoType,
            videoTitle: videoData.title,
            videoDescription: formData.description,
            opposingTeam: formData.opposingTeam,
            matchDate: formData.matchDate,
            score: formData.score,
            taggedPlayers: taggedPlayers,
            teamId: teamId
          }
        });

      if (analysisError) {
        console.error('AI analysis failed:', analysisError);
      }
    } catch (analysisError) {
      console.error('Failed to start AI analysis:', analysisError);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileVideo className="w-5 h-5 text-bright-pink" />
          Upload Match Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-bright-pink transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">Click to select video files</p>
            <p className="text-sm text-gray-500">MP4, MOV, AVI up to 100MB each (will be compressed to 10MB)</p>
            
            <Button 
              type="button"
              className="mt-4 bg-bright-pink hover:bg-bright-pink/90"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Videos
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Compression Progress */}
        {isCompressing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Compressing videos...</span>
              <span className="text-bright-pink">{Math.round(compressionProgress)}%</span>
            </div>
            <Progress value={compressionProgress} className="h-2" />
          </div>
        )}

        {/* Video Previews */}
        {videoFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Selected Videos ({videoFiles.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {videoFiles.map((videoFile) => (
                <div key={videoFile.id} className="relative bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={videoFile.thumbnail} 
                      alt="Video thumbnail"
                      className="w-16 h-9 object-cover rounded bg-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{videoFile.file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(videoFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVideo(videoFile.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video Type *
              </label>
              <Select
                value={formData.videoType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, videoType: value }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Match</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="highlight">Highlight</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what happens in the video..."
              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
            />
          </div>

          {formData.videoType === 'match' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Opposing Team
                </label>
                <Input
                  value={formData.opposingTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, opposingTeam: e.target.value }))}
                  placeholder="Opposition team name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Match Date
                </label>
                <Input
                  type="date"
                  value={formData.matchDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Final Score
                </label>
                <Input
                  value={formData.score}
                  onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                  placeholder="2-1"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          )}

          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team
            </label>
            <Select
              value={formData.teamId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player Tagging */}
          <PlayerTagging
            selectedPlayers={taggedPlayers}
            onPlayersChange={setTaggedPlayers}
            teamId={formData.teamId}
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Uploading videos...</span>
                <span className="text-bright-pink">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isUploading || isCompressing}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isUploading || isCompressing || videoFiles.length === 0}
              className="bg-bright-pink hover:bg-bright-pink/90"
            >
              {isUploading || isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Upload ${videoFiles.length > 0 ? `${videoFiles.length} Video${videoFiles.length > 1 ? 's' : ''}` : 'Videos'}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedVideoUploadForm;
