import React, { useState, useRef } from 'react';
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
import { Upload, X, Play, FileVideo, Loader2 } from 'lucide-react';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess, onCancel }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [opposingTeam, setOpposingTeam] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [score, setScore] = useState('');
  const [homeOrAway, setHomeOrAway] = useState<'home' | 'away'>('home');
  const [videoType, setVideoType] = useState('match');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const availableTags = ['highlights', 'goals', 'saves', 'skills', 'training', 'match', 'analysis'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a video file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a video file smaller than 500MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile?.id) return;

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

      // Upload file to storage without onUploadProgress (not supported in current version)
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Simulate progress updates
      setUploadProgress(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      setUploadProgress(60);

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          team_id: teamData.id,
          title: videoTitle,
          description: videoDescription,
          video_url: publicUrl,
          opposing_team: opposingTeam || null,
          match_date: matchDate || null,
          score: score || null,
          home_or_away: homeOrAway,
          video_type: videoType,
          tags: selectedTags,
          file_size: selectedFile.size,
          upload_status: 'completed',
          ai_analysis_status: 'pending'
        })
        .select()
        .single();

      if (videoError) throw videoError;

      setUploadProgress(100);

      toast({
        title: "Upload Successful",
        description: "Video has been uploaded and is ready for analysis",
      });

      // Reset form
      setSelectedFile(null);
      setVideoTitle('');
      setVideoDescription('');
      setOpposingTeam('');
      setMatchDate('');
      setScore('');
      setSelectedTags([]);
      setPreviewUrl('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

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

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="w-5 h-5 text-bright-pink" />
          Upload Match Video
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
                  Choose a video file to upload (Max 500MB)
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
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

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

        {/* Video Details Form */}
        {selectedFile && !isUploading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
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
                  placeholder="Describe the video content"
                  className="bg-gray-700 border-gray-600 text-white min-h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Type
                </label>
                <Select value={videoType} onValueChange={setVideoType}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="highlight">Highlight</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Match Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Opposing Team
                </label>
                <Input
                  value={opposingTeam}
                  onChange={(e) => setOpposingTeam(e.target.value)}
                  placeholder="Enter opposing team name"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    Final Score
                  </label>
                  <Input
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="2-1"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Home/Away
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
        )}

        {/* Tags */}
        {selectedFile && !isUploading && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedTags.includes(tag) 
                      ? 'bg-bright-pink hover:bg-bright-pink/90' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && !isUploading && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!videoTitle.trim()}
              className="flex-1 bg-bright-pink hover:bg-bright-pink/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-600"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;
