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
import { Upload, X, Play, FileVideo, Loader2, User } from 'lucide-react';
import { PlayerTagging } from './PlayerTagging';
import { smartCompress } from '@/services/fastVideoCompressionService';

interface EnhancedVideoUploadFormProps {
  teamId: string;
  onUploadComplete?: () => void;
}

const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({ teamId, onUploadComplete }) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoType, setVideoType] = useState<'match' | 'training' | 'interview' | 'highlight'>('match');
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    // Check file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setCompressedFile(null);

    // Auto-compress if file is over 10MB
    if (file.size > 10 * 1024 * 1024) {
      handleCompression(file);
    }
  };

  const handleCompression = async (file: File) => {
    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      const compressed = await smartCompress(file);

      setCompressedFile(compressed);
      
      toast({
        title: "Compression Complete",
        description: `Video compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Compression Failed",
        description: "Video will be uploaded without compression",
        variant: "destructive"
      });
      setCompressedFile(file); // Fallback to original
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !videoTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide video file and title",
        variant: "destructive"
      });
      return;
    }

    const fileToUpload = compressedFile || selectedFile;
    
    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload video file
      const fileName = `${teamId}/${Date.now()}_${fileToUpload.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      setUploadProgress(70);

      // Get video duration
      const duration = await getVideoDuration(fileToUpload);

      // Create video record
      const videoData = {
        team_id: teamId,
        title: videoTitle,
        description: videoDescription,
        video_type: videoType,
        video_url: urlData.publicUrl,
        file_size: fileToUpload.size,
        duration: duration,
        tagged_players: taggedPlayers,
        ai_analysis_status: 'pending'
      };

      const { data: video, error: videoError } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

      if (videoError) throw videoError;

      setUploadProgress(100);

      toast({
        title: "Upload Successful",
        description: "Video uploaded successfully and ready for analysis",
      });

      // Reset form
      setSelectedFile(null);
      setCompressedFile(null);
      setVideoTitle('');
      setVideoDescription('');
      setTaggedPlayers([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setCompressedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-bright-pink" />
          Enhanced Video Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-white font-medium">Video File *</label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            {!selectedFile ? (
              <div>
                <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  Drop your video file here or click to browse
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="video-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-gray-600 text-gray-300"
                >
                  Choose File
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Max size: 100MB • Supported: MP4, MOV, AVI
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-700 rounded p-4">
                <div className="flex items-center gap-3">
                  <FileVideo className="w-8 h-8 text-bright-pink" />
                  <div className="text-left">
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Compression Status */}
        {isCompressing && (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-bright-pink animate-spin" />
              <span className="text-white font-medium">Compressing Video</span>
            </div>
            <Progress value={compressionProgress} className="mb-2" />
            <p className="text-sm text-gray-400">{compressionProgress}% complete</p>
          </div>
        )}

        {compressedFile && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 font-medium mb-2">✓ Compression Complete</p>
            <p className="text-gray-300 text-sm">
              Size reduced to {(compressedFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        )}

        {/* Video Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-white font-medium">Video Title *</label>
            <Input
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title..."
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Video Type *</label>
            <Select value={videoType} onValueChange={(value: any) => setVideoType(value)}>
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

        <div className="space-y-2">
          <label className="text-white font-medium">Description</label>
          <Textarea
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            placeholder="Describe the video content..."
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        {/* Player Tagging */}
        <div className="space-y-3">
          <label className="text-white font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            Tag Players (Optional)
          </label>
          <PlayerTagging
            selectedPlayers={taggedPlayers}
            onPlayersChange={setTaggedPlayers}
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">Uploading...</span>
              <span className="text-gray-400">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !videoTitle.trim() || uploading || isCompressing}
          className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EnhancedVideoUploadForm;
