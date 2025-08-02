
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Video, FileVideo, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { smartCompress } from '@/services/fastVideoCompressionService';

interface VideoUploadFormProps {
  onVideoUploaded: () => void;
  onCancel?: () => void;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onVideoUploaded, onCancel }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    video_type: 'highlight',
    match_date: '',
    opposing_team: '',
    score: '',
    home_or_away: '',
    is_public: true
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [teamId, setTeamId] = useState<string>('');

  React.useEffect(() => {
    fetchTeamId();
  }, [profile]);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid video file (MP4, WebM, MOV, AVI, MKV)",
        variant: "destructive"
      });
      return;
    }

    // Check file size (100MB limit before compression)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a video smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    setVideoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile || !teamId) {
      toast({
        title: "Missing Information",
        description: "Please select a video file and ensure your team profile is set up",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setCompressionProgress(0);

    try {
      // Step 1: Fast compression (only if needed)
      setIsCompressing(true);
      let finalVideoFile = videoFile;
      
      const compressionTimer = setInterval(() => {
        setCompressionProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        finalVideoFile = await smartCompress(videoFile);
        setCompressionProgress(100);
        clearInterval(compressionTimer);
      } catch (compressionError) {
        console.warn('Compression failed, using original file:', compressionError);
        finalVideoFile = videoFile;
        clearInterval(compressionTimer);
      }
      
      setIsCompressing(false);

      // Step 2: Generate thumbnail (quick capture)
      const thumbnail = await generateThumbnail(finalVideoFile);
      
      // Step 3: Upload video with progress tracking
      const fileExt = finalVideoFile.name.split('.').pop() || 'mp4';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: videoUpload, error: videoUploadError } = await supabase.storage
        .from('match-videos')
        .upload(fileName, finalVideoFile, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          }
        });

      if (videoUploadError) throw videoUploadError;

      // Step 4: Upload thumbnail if generated
      let thumbnailUrl = null;
      if (thumbnail) {
        const thumbFileName = `thumb_${fileName.replace(/\.[^/.]+$/, '.jpg')}`;
        const { data: thumbUpload } = await supabase.storage
          .from('video-thumbnails')
          .upload(thumbFileName, thumbnail);

        if (thumbUpload) {
          const { data: thumbUrlData } = supabase.storage
            .from('video-thumbnails')
            .getPublicUrl(thumbFileName);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      }

      // Step 5: Get video URL and save to database
      const { data: videoUrlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          team_id: teamId,
          title: formData.title,
          description: formData.description,
          video_url: videoUrlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          video_type: formData.video_type,
          match_date: formData.match_date || null,
          opposing_team: formData.opposing_team || null,
          score: formData.score || null,
          home_or_away: formData.home_or_away || null,
          is_public: formData.is_public,
          file_size: finalVideoFile.size,
          upload_status: 'completed',
          ai_analysis_status: 'pending' // Only uploaded videos get AI analysis
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Video uploaded successfully! AI analysis will begin shortly.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        tags: '',
        video_type: 'highlight',
        match_date: '',
        opposing_team: '',
        score: '',
        home_or_away: '',
        is_public: true
      });
      setVideoFile(null);
      
      onVideoUploaded();

    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setCompressionProgress(0);
      setIsCompressing(false);
    }
  };

  const generateThumbnail = async (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        canvas.width = 320; // Small thumbnail for speed
        canvas.height = (320 * video.videoHeight) / video.videoWidth;
        
        video.currentTime = Math.min(2, video.duration / 4); // Get frame from 25% or 2s
      };

      video.onseeked = () => {
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  };

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white font-polysans">
          <Upload className="w-5 h-5" />
          Upload Video
          <Zap className="w-4 h-4 text-yellow-400" title="Fast compression enabled" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-gray-300">Video File *</Label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-rosegold transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
                disabled={loading}
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                {videoFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileVideo className="w-8 h-8 text-rosegold" />
                    <div>
                      <p className="text-white font-medium">{videoFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-white mb-2">Click to select video</p>
                    <p className="text-gray-400 text-sm">
                      MP4, WebM, MOV, AVI, MKV up to 100MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Compression Progress */}
          {isCompressing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                <Label className="text-yellow-400">Fast Compressing Video...</Label>
              </div>
              <Progress value={compressionProgress} className="h-2" />
            </div>
          )}

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && !isCompressing && (
            <div className="space-y-2">
              <Label className="text-rosegold">Uploading Video...</Label>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter video title"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Video Type</Label>
              <Select value={formData.video_type} onValueChange={(value) => setFormData({...formData, video_type: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highlight">Match Highlights</SelectItem>
                  <SelectItem value="full_match">Full Match</SelectItem>
                  <SelectItem value="training">Training Session</SelectItem>
                  <SelectItem value="skills">Skills Showcase</SelectItem>
                  <SelectItem value="analysis">Match Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the video content..."
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>

          {/* Match Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Match Date</Label>
              <Input
                type="date"
                value={formData.match_date}
                onChange={(e) => setFormData({...formData, match_date: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Opposing Team</Label>
              <Input
                value={formData.opposing_team}
                onChange={(e) => setFormData({...formData, opposing_team: e.target.value})}
                placeholder="vs Team Name"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Final Score</Label>
              <Input
                value={formData.score}
                onChange={(e) => setFormData({...formData, score: e.target.value})}
                placeholder="2-1"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Home/Away</Label>
              <Select value={formData.home_or_away} onValueChange={(value) => setFormData({...formData, home_or_away: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-gray-300">Tags</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="goals, assists, highlights (comma separated)"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading || !videoFile}
              className="flex-1 bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
            >
              {loading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  {isCompressing ? 'Compressing...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="px-6"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;
