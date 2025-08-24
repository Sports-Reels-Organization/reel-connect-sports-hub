import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PlayerTagging from '@/components/PlayerTagging';
import { 
  Upload, 
  Video, 
  FileText, 
  Users, 
  Calendar,
  MapPin,
  Trophy,
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface VideoMetadata {
  title: string;
  description: string;
  video_type: 'highlight' | 'full_game' | 'training' | 'other';
  location: string;
  date: string;
  tags: string[];
  players: string[];
}

interface Player {
  id: string;
  full_name: string;
}

const EnhancedVideoUploadForm = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    video_type: 'highlight',
    location: '',
    date: '',
    tags: [],
    players: [],
  });
  const [uploading, setUploading] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!profile?.id) return;

      try {
        const { data: team } = await supabase
          .from('teams')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (team) {
          const { data: players, error } = await supabase
            .from('players')
            .select('id, full_name')
            .eq('team_id', team.id);

          if (error) throw error;
          setAvailablePlayers(players || []);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, [profile?.id]);

  const handleVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setUploading(false);
    setUploadProgress(0);

    const thumbnail = await generateThumbnail(file);
    setThumbnailUrl(thumbnail);

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.addEventListener('loadedmetadata', () => {
      setVideoDuration(video.duration);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerTag = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
    setMetadata(prev => ({
      ...prev,
      players: selectedPlayers
    }));
  };

  const handleUpload = async () => {
    if (!videoFile || !profile?.id) {
      toast({
        title: "Error",
        description: "Please select a video file.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!team) {
        toast({
          title: "Error",
          description: "Team not found for the logged-in user.",
          variant: "destructive"
        });
        return;
      }

      const videoFileName = `${Date.now()}-${videoFile.name}`;
      const videoPath = `videos/${team.id}/${videoFileName}`;

      const { data, error } = await supabase.storage
        .from('team-videos')
        .upload(videoPath, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading video:', error);
        toast({
          title: "Error",
          description: `Failed to upload video: ${error.message}`,
          variant: "destructive"
        });
        setUploading(false);
        return;
      }

      const thumbnailUrlFileName = `${Date.now()}-thumbnail.jpg`;
      const thumbnailPath = `videos/${team.id}/thumbnails/${thumbnailUrlFileName}`;

      // Convert the data URL to a Blob
      const blob = await (await fetch(thumbnailUrl)).blob();

      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('team-videos')
        .upload(thumbnailPath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (thumbnailError) {
        console.error('Error uploading thumbnail:', thumbnailError);
        toast({
          title: "Error",
          description: `Failed to upload thumbnail: ${thumbnailError.message}`,
          variant: "destructive"
        });
        setUploading(false);
        return;
      }

      const videoUrl = `${supabase.storage.from('team-videos').getPublicUrl(videoPath).data.publicUrl}`;
      const thumbnailUrl = `${supabase.storage.from('team-videos').getPublicUrl(thumbnailPath).data.publicUrl}`;

      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          team_id: team.id,
          title: metadata.title,
          description: metadata.description,
          video_type: metadata.video_type,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          location: metadata.location,
          date: metadata.date,
          tags: metadata.tags,
          players: metadata.players,
          duration: videoDuration,
        });

      if (dbError) {
        console.error('Error saving video metadata:', dbError);
        toast({
          title: "Error",
          description: `Failed to save video metadata: ${dbError.message}`,
          variant: "destructive"
        });
        setUploading(false);
        return;
      }

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      resetForm();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({
        title: "Error",
        description: `Upload failed: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setThumbnailUrl(null);
    setUploadProgress(0);
    setMetadata({
      title: '',
      description: '',
      video_type: 'highlight',
      location: '',
      date: '',
      tags: [],
      players: [],
    });
    setSelectedPlayers([]);
    setVideoDuration(0);
    setVideoStatus('idle');
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (videoStatus === 'idle' || videoStatus === 'paused') {
      videoRef.current.play();
      setVideoStatus('playing');
    } else {
      videoRef.current.pause();
      setVideoStatus('paused');
    }
  };

  const handleVideoEnded = () => {
    setVideoStatus('paused');
  };

  const handleRewind = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setVideoStatus('paused');
  };

  const generateThumbnail = useCallback(async (videoFile: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = Math.min(5, video.duration / 4);
      });

      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailDataUrl);
        }
      });

      video.src = URL.createObjectURL(videoFile);
    });
  }, []);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white font-polysans flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Input */}
        <div>
          <Label htmlFor="video-upload" className="text-white">
            Select Video File
          </Label>
          <Input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
            id="video-upload"
            disabled={uploading}
          />
          <div className="mt-2">
            <label
              htmlFor="video-upload"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-600 hover:border-rosegold/50 transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <Video className="h-4 w-4" />
              <span className="text-white">Choose Video</span>
            </label>
            {videoFile && (
              <div className="mt-3 flex items-center gap-4">
                {thumbnailUrl && (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden">
                    <img
                      src={thumbnailUrl}
                      alt="Video Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge variant="secondary">{videoDuration ? `${videoDuration.toFixed(0)}s` : 'Loading...'}</Badge>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{videoFile.name}</p>
                  <p className="text-gray-400 text-sm">{videoFile.size > 1024 * 1024 ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB` : `${(videoFile.size / 1024).toFixed(2)} KB`}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Preview */}
        {videoFile && (
          <div className="space-y-2">
            <Label className="text-white">Video Preview</Label>
            <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={URL.createObjectURL(videoFile)}
                className="w-full h-full object-contain"
                onEnded={handleVideoEnded}
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {videoStatus === 'playing' ? (
                  <Button variant="ghost" size="icon" onClick={togglePlay}>
                    <Pause className="h-6 w-6 text-white" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={togglePlay}>
                    <Play className="h-6 w-6 text-white" />
                  </Button>
                )}
              </div>
              <div className="absolute bottom-2 right-2">
                <Button variant="ghost" size="icon" onClick={handleRewind}>
                  <RotateCcw className="h-5 w-5 text-white" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Inputs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="details" className="text-white">Details</TabsTrigger>
            <TabsTrigger value="tags" className="text-white">Tags & Players</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">
                Title
              </Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={metadata.title}
                onChange={handleInputChange}
                placeholder="Video Title"
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={metadata.description}
                onChange={handleInputChange}
                placeholder="Video Description"
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="video_type" className="text-white">
                Video Type
              </Label>
              <Select onValueChange={(value) => handleSelectChange('video_type', value)} defaultValue={metadata.video_type}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select video type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highlight">Highlight</SelectItem>
                  <SelectItem value="full_game">Full Game</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location" className="text-white">
                  Location
                </Label>
                <Input
                  type="text"
                  id="location"
                  name="location"
                  value={metadata.location}
                  onChange={handleInputChange}
                  placeholder="Location"
                  disabled={uploading}
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-white">
                  Date
                </Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={metadata.date}
                  onChange={handleInputChange}
                  disabled={uploading}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="tags" className="space-y-4">
            <div>
              <Label htmlFor="tags" className="text-white">
                Tags
              </Label>
              <Input
                type="text"
                id="tags"
                name="tags"
                value={metadata.tags.join(', ')}
                onChange={handleInputChange}
                placeholder="Tags (comma separated)"
                disabled={uploading}
              />
            </div>
            <div>
              <Label className="text-white">Players</Label>
              {availablePlayers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availablePlayers.map((player) => (
                    <Button
                      key={player.id}
                      variant={selectedPlayers.includes(player.id) ? 'default' : 'outline'}
                      onClick={() => handlePlayerTag(player.id)}
                      disabled={uploading}
                    >
                      {player.full_name}
                      {selectedPlayers.includes(player.id) && <Check className="h-4 w-4 ml-1" />}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400">No players available.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload Button */}
        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              Uploading...
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </>
          ) : (
            "Upload Video"
          )}
        </Button>

        {/* Upload Progress */}
        {uploading && (
          <div>
            <Progress value={uploadProgress} />
            <p className="text-gray-400 text-sm mt-1">{uploadProgress}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedVideoUploadForm;
