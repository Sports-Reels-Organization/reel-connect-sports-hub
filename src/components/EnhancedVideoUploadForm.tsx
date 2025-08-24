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
import { Upload, X, Play, FileVideo, Loader2, User, Star, Activity, MessageSquare, Users } from 'lucide-react';
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

export const EnhancedVideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess, onCancel }) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    matchDate: '',
    opposingTeam: '',
    score: '',
  });
  const [taggedPlayers, setTaggedPlayers] = useState<
    { playerId: string; playerName: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoType, setVideoType] = useState<'match' | 'interview' | 'training' | 'highlight'>('match');

  useEffect(() => {
    if (selectedFile) {
      const previewURL = URL.createObjectURL(selectedFile);
      setVideoPreview(previewURL);

      const video = document.createElement('video');
      video.src = previewURL;
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);

      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        document.body.removeChild(video);
      };

      return () => {
        URL.revokeObjectURL(previewURL);
        if (video.parentNode) {
          document.body.removeChild(video);
        }
      };
    }
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagPlayer = (player: { playerId: string; playerName: string }) => {
    setTaggedPlayers((prev) => {
      if (prev.find((p) => p.playerId === player.playerId)) {
        return prev;
      }
      return [...prev, player];
    });
  };

  const handleRemoveTag = (playerId: string) => {
    setTaggedPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !profile?.id) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    if (taggedPlayers.length === 0) {
      toast({
        title: "Warning",
        description: "No players tagged. Consider adding player tags for better analysis.",
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

      // Upload video file without onUploadProgress (not supported in Supabase)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${teamData.id}/${fileName}`;

      setUploadProgress(20); // Manual progress update

      const { error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(60); // Manual progress update

      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(filePath);

      setUploadProgress(80); // Manual progress update

      // Create video record with video type
      const { data: videoData, error: insertError } = await supabase
        .from('videos')
        .insert({
          team_id: teamData.id,
          title: formData.title,
          description: formData.description,
          video_url: publicUrl,
          duration: Math.floor(videoDuration),
          tagged_players: taggedPlayers.map(p => p.playerId),
          match_date: formData.matchDate,
          opposing_team: formData.opposingTeam,
          score: formData.score,
          file_size: selectedFile.size,
          ai_analysis_status: 'pending',
          upload_status: 'completed',
          tags: [videoType], // Add video type as tag
          // Add video type specific metadata
          ai_analysis: {
            video_type: videoType,
            metadata: {
              playerTags: taggedPlayers,
              matchDetails: videoType === 'match' ? {
                opposingTeam: formData.opposingTeam,
                matchDate: formData.matchDate,
                finalScore: formData.score
              } : undefined,
              duration: Math.floor(videoDuration),
              videoDescription: formData.description,
              uploadedAt: new Date().toISOString()
            }
          }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(100);

      toast({
        title: "Upload Successful",
        description: `${videoType.charAt(0).toUpperCase() + videoType.slice(1)} video uploaded successfully! AI analysis will be available after upload.`,
      });

      if (onSuccess) {
        onSuccess();
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

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white font-polysans flex items-center gap-2">
          <Upload className="w-6 h-6 text-bright-pink" />
          Upload New Video
        </CardTitle>
        <p className="text-gray-400">
          Upload your video and select the type for AI-powered analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Type Selection - NEW */}
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
            <p className="text-xs text-gray-400">
              {videoType === 'match' && 'AI will track players, analyze events, generate heatmaps, and provide tactical insights.'}
              {videoType === 'highlight' && 'AI will auto-generate highlights, classify skills, compare with similar players, and enhance quality.'}
              {videoType === 'training' && 'AI will analyze biomechanics, detect work rate, provide coaching insights, and track progress.'}
              {videoType === 'interview' && 'AI will transcribe speech, analyze sentiment, generate translations, and create bio extracts.'}
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-upload" className="text-white font-medium">
              Video File <span className="text-red-500">*</span>
            </Label>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-bright-pink transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileVideo className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">Click to select your {videoType} video</p>
                <p className="text-sm text-gray-500">MP4, AVI, MOV up to 500MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {formatFileSize(selectedFile.size)}
                  {videoDuration > 0 && ` • ${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toString().padStart(2, '0')}`}
                </div>
                {videoPreview && (
                  <video 
                    src={videoPreview} 
                    controls 
                    className="w-full max-h-40 rounded bg-black"
                  />
                )}
              </div>
            )}
          </div>

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
              placeholder="Enter video description"
              className="bg-gray-700 border-gray-600 text-white resize-none"
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
                  placeholder="Enter opposing team name"
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
                  placeholder="Enter match score (e.g., 2-1)"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-white font-medium">Tag Players</Label>
            <PlayerTagging 
              selectedPlayers={taggedPlayers}
              onPlayerSelect={(playerId: string, playerName: string) => handleTagPlayer({ playerId, playerName })}
              onPlayerRemove={handleRemoveTag}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isUploading}
              className="flex-1 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading... ({uploadProgress.toFixed(0)}%)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
