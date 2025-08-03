
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, Play, FileVideo, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { smartCompress } from '@/services/fastVideoCompressionService';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess, onCancel }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [opposingTeam, setOpposingTeam] = useState('');
  const [score, setScore] = useState('');
  const [homeOrAway, setHomeOrAway] = useState<'home' | 'away'>('home');
  const [videoType, setVideoType] = useState('highlight');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchPlayers();
  }, [profile]);

  const fetchPlayers = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, position, photo_url')
        .eq('team_id', teamData.id)
        .order('full_name');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid video file (MP4, WebM, OGG, MOV)",
        variant: "destructive"
      });
      return;
    }

    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video file must be less than 500MB. It will be compressed automatically.",
        variant: "destructive"
      });
    }

    setFile(selectedFile);
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Auto-generate title from filename if empty
    if (!title) {
      const fileName = selectedFile.name.split('.')[0];
      setTitle(fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide a video file and title",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload videos",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
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

      // Compress video if needed
      setCompressing(true);
      setCompressionProgress(20);
      
      const compressedFile = await smartCompress(file);
      setCompressionProgress(100);
      setCompressing(false);
      setUploadProgress(10);

      // Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `team-videos/${teamData.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team_videos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team_videos')
        .getPublicUrl(filePath);

      setUploadProgress(80);

      // Create video record in database
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          team_id: teamData.id,
          title: title.trim(),
          description: description.trim() || null,
          video_url: publicUrl,
          match_date: matchDate || null,
          opposing_team: opposingTeam.trim() || null,
          score: score.trim() || null,
          home_or_away: homeOrAway,
          video_type: videoType,
          tagged_players: selectedPlayers,
          tags: [videoType], // Add video type as default tag
          duration: Math.floor(Math.random() * 300) + 60, // Placeholder - would be extracted from actual video
          file_size: compressedFile.size,
          upload_status: 'completed',
          ai_analysis_status: 'pending',
          compressed_url: publicUrl,
          is_public: true
        })
        .select()
        .single();

      if (videoError) throw videoError;

      setUploadProgress(100);

      toast({
        title: "Video uploaded successfully!",
        description: "Your video is now ready for AI analysis",
      });

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setMatchDate('');
      setOpposingTeam('');
      setScore('');
      setHomeOrAway('home');
      setVideoType('highlight');
      setSelectedPlayers([]);
      setPreviewUrl('');

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setCompressing(false);
      setUploadProgress(0);
      setCompressionProgress(0);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-bright-pink" />
          Upload Video
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-bright-pink bg-bright-pink/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileVideo className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Upload Video File
                </h3>
                <p className="text-gray-400 mb-4">
                  Drag and drop your video file here, or click to browse
                </p>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-600"
                    onClick={() => document.getElementById('video-upload')?.click()}
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500">
                    Supports: MP4, WebM, OGG, MOV • Max size: 500MB • Auto-compression enabled
                  </p>
                </div>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {previewUrl && (
                        <video
                          src={previewUrl}
                          className="w-24 h-16 object-cover rounded bg-gray-700"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{file.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Compression Progress */}
                {compressing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Compressing video...</span>
                      <span className="text-gray-400">{compressionProgress}%</span>
                    </div>
                    <Progress value={compressionProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Video Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="bg-gray-800 border-gray-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-type" className="text-white">
                Video Type
              </Label>
              <Select value={videoType} onValueChange={setVideoType}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select video type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highlight">Highlight Reel</SelectItem>
                  <SelectItem value="match">Full Match</SelectItem>
                  <SelectItem value="training">Training Session</SelectItem>
                  <SelectItem value="skills">Skills Showcase</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the video content, key moments, or context"
              className="bg-gray-800 border-gray-600 min-h-20"
              rows={3}
            />
          </div>

          {/* Match Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match-date" className="text-white">
                Match Date
              </Label>
              <Input
                id="match-date"
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opposing-team" className="text-white">
                Opposing Team
              </Label>
              <Input
                id="opposing-team"
                value={opposingTeam}
                onChange={(e) => setOpposingTeam(e.target.value)}
                placeholder="Team name"
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="score" className="text-white">
                Final Score
              </Label>
              <Input
                id="score"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="2-1"
                className="bg-gray-800 border-gray-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Home or Away</Label>
            <Select value={homeOrAway} onValueChange={(value: 'home' | 'away') => setHomeOrAway(value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="away">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Player Tagging */}
          <div className="space-y-4">
            <Label className="text-white">Tag Players in Video</Label>
            <p className="text-gray-400 text-sm">
              Select players featured in this video for better organization and analysis
            </p>
            
            {players.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlayers.includes(player.id)
                        ? 'border-bright-pink bg-bright-pink/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => togglePlayerSelection(player.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            {player.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {player.full_name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {player.position}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No players found. Add players to your team first.
              </p>
            )}

            {selectedPlayers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedPlayers.map((playerId) => {
                  const player = players.find(p => p.id === playerId);
                  return player ? (
                    <Badge key={playerId} variant="secondary" className="bg-bright-pink/20 text-bright-pink">
                      {player.full_name}
                      <button
                        type="button"
                        onClick={() => togglePlayerSelection(playerId)}
                        className="ml-2 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-bright-pink" />
                <span className="text-white">Uploading video...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-gray-400 text-sm">
                Please don't close this page while uploading
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!file || !title.trim() || uploading || compressing}
              className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              {uploading || compressing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {compressing ? 'Compressing...' : 'Uploading...'}
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
                disabled={uploading || compressing}
                className="border-gray-600"
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
