
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VideoCompressionService } from '@/services/videoCompressionService';
import EnhancedVideoAnalysis from './EnhancedVideoAnalysis';
import {
  Upload,
  FileVideo,
  Users,
  Archive,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  jersey_number?: number;
  position: string;
}

interface EnhancedVideoUploadProps {
  teamId: string;
  onVideoUploaded?: (videoData: any) => void;
}

const EnhancedVideoUpload: React.FC<EnhancedVideoUploadProps> = ({
  teamId,
  onVideoUploaded
}) => {
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoType, setVideoType] = useState<'match' | 'training' | 'interview' | 'highlight'>('match');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [uploadedVideoData, setUploadedVideoData] = useState<any>(null);

  const compressionService = new VideoCompressionService();

  // Fetch team players on component mount
  React.useEffect(() => {
    fetchTeamPlayers();
  }, [teamId]);

  const fetchTeamPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, jersey_number, position')
        .eq('team_id', teamId)
        .order('jersey_number');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to load team players",
        variant: "destructive"
      });
    }
  };

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

    // Check file size (warn if over 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "Large File",
        description: "File is quite large. Compression will be applied automatically.",
      });
    }

    setVideoFile(file);
    setCompressedFile(null);
    setUploadComplete(false);
  };

  const handleCompression = async () => {
    if (!videoFile) return;

    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      const compressed = await compressionService.compressVideoTo10MB(
        videoFile,
        (progress) => setCompressionProgress(progress)
      );

      setCompressedFile(compressed);
      toast({
        title: "Compression Complete",
        description: `Video compressed from ${(videoFile.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Compression Failed",
        description: "Using original file for upload",
        variant: "destructive"
      });
      setCompressedFile(videoFile); // Fallback to original
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide video file and title",
        variant: "destructive"
      });
      return;
    }

    const fileToUpload = compressedFile || videoFile;
    
    // Check final file size
    if (fileToUpload.size > 10 * 1024 * 1024) {
      const shouldProceed = window.confirm(
        'Video is still over 10MB. Would you like to compress it first?'
      );
      if (shouldProceed && !compressedFile) {
        await handleCompression();
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload video file to storage
      const fileName = `${teamId}/${Date.now()}-${fileToUpload.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Generate thumbnail
      const thumbnailUrl = await compressionService.generateThumbnail(fileToUpload);
      
      setUploadProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      // Get video duration
      const duration = await compressionService.getVideoDuration(fileToUpload);

      // Create video record
      const videoData = {
        team_id: teamId,
        title: videoTitle,
        description: videoDescription,
        video_type: videoType,
        video_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        file_size: fileToUpload.size,
        duration: duration,
        tagged_players: selectedPlayer ? [selectedPlayer] : [],
        ai_analysis_status: 'pending'
      };

      const { data: video, error: videoError } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

      if (videoError) throw videoError;

      setUploadProgress(100);
      setUploadComplete(true);
      setUploadedVideoData(video);

      toast({
        title: "Upload Successful",
        description: "Video uploaded and ready for AI analysis",
      });

      onVideoUploaded?.(video);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startAnalysis = () => {
    setShowAnalysis(true);
  };

  if (showAnalysis && uploadedVideoData && (compressedFile || videoFile)) {
    return (
      <EnhancedVideoAnalysis
        videoFile={compressedFile || videoFile}
        videoType={videoType}
        taggedPlayers={selectedPlayer ? [selectedPlayer] : []}
        videoTitle={videoTitle}
        videoId={uploadedVideoData.id}
        teamId={teamId}
        onAnalysisComplete={(analysisData) => {
          console.log('Analysis completed:', analysisData);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
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
            <Label className="text-white">Select Video File</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {videoFile && (
                <Badge variant="outline" className="text-bright-pink border-bright-pink">
                  <FileVideo className="w-3 h-3 mr-1" />
                  {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                </Badge>
              )}
            </div>
          </div>

          {/* Video Compression */}
          {videoFile && videoFile.size > 10 * 1024 * 1024 && (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-white font-medium">Video Compression</h4>
                    <p className="text-gray-400 text-sm">
                      File is {(videoFile.size / 1024 / 1024).toFixed(1)}MB. Compress to ~10MB for optimal upload.
                    </p>
                  </div>
                  <Button
                    onClick={handleCompression}
                    disabled={isCompressing}
                    className="bg-bright-pink hover:bg-bright-pink/90"
                  >
                    {isCompressing ? (
                      <>
                        <Archive className="w-4 h-4 mr-2 animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4 mr-2" />
                        Compress Video
                      </>
                    )}
                  </Button>
                </div>
                
                {isCompressing && (
                  <div className="space-y-2">
                    <Progress value={compressionProgress} className="h-2" />
                    <p className="text-sm text-gray-400">{compressionProgress}% compressed</p>
                  </div>
                )}
                
                {compressedFile && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Compressed to {(compressedFile.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Video Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Video Title *</Label>
              <Input
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Video Type *</Label>
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
            <Label className="text-white">Description</Label>
            <Textarea
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Describe the video content..."
              className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
            />
          </div>

          {/* Player Selection */}
          <div className="space-y-3">
            <Label className="text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tagged Player (Optional)
            </Label>
            
            {players.length > 0 ? (
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select a player to tag (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No player selected</SelectItem>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.full_name} (#{player.jersey_number || 'N/A'} • {player.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-gray-400 text-sm">
                No players found. Add players to your team first.
              </div>
            )}

            {selectedPlayer && (
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const player = players.find(p => p.id === selectedPlayer);
                  if (!player) return null;
                  return (
                    <Badge className="bg-bright-pink/20 text-bright-pink border-bright-pink">
                      {player.full_name}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => setSelectedPlayer('')}
                      />
                    </Badge>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-sm text-gray-400">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={!videoFile || !videoTitle.trim() || isUploading || isCompressing}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white flex-1"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>

            {uploadComplete && (
              <Button
                onClick={startAnalysis}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Start AI Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedVideoUpload;
