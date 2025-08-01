
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, Play, Plus } from 'lucide-react';
import { validateVideoUrl, validateVideoOrientation } from '@/utils/videoValidation';
import { compressVideo, getVideoDuration } from '@/services/videoCompressionService';

interface VideoUploadFormProps {
  onUploadComplete: () => void;
  onClose: () => void;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onUploadComplete, onClose }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    matchDate: '',
    opposingTeam: '',
    homeOrAway: 'home' as 'home' | 'away',
    finalScoreHome: '',
    finalScoreAway: '',
    videoType: 'highlight' as 'highlight' | 'full_match' | 'training',
    leagueId: '',
    taggedPlayers: [] as string[],
    tags: [] as string[]
  });

  const [teamId, setTeamId] = useState<string>('');
  const [players, setPlayers] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);

  React.useEffect(() => {
    fetchTeamData();
    fetchLeagues();
  }, [profile]);

  const fetchTeamData = async () => {
    if (!profile?.id) return;

    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamError || !team) {
        console.error('Error fetching team:', teamError);
        return;
      }

      setTeamId(team.id);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, full_name, position')
        .eq('team_id', team.id)
        .order('full_name');

      if (playersError) {
        console.error('Error fetching players:', playersError);
        return;
      }

      setPlayers(playersData || []);
    } catch (error) {
      console.error('Error in fetchTeamData:', error);
    }
  };

  const fetchLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('id, name, country')
        .order('name');

      if (error) {
        console.error('Error fetching leagues:', error);
        return;
      }

      setLeagues(data || []);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const uploadVideoFile = async (file: File): Promise<string> => {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Upload to match-videos bucket
      const { data, error } = await supabase.storage
        .from('match-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Failed to upload video: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      if (!publicData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded video');
      }

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading video file:', error);
      throw error;
    }
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('video-thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload thumbnail: ${error.message}`);
      }

      const { data: publicData } = supabase.storage
        .from('video-thumbnails')
        .getPublicUrl(fileName);

      return publicData?.publicUrl || '';
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  };

  const generateThumbnail = async (videoFile: File): Promise<File | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = Math.min(5, video.duration * 0.1); // 5 seconds or 10% of video
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
              resolve(thumbnailFile);
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.8);
        } else {
          resolve(null);
        }
      };

      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamId) {
      toast({
        title: "Error",
        description: "Team information not found. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video title.",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'file' && !formData.videoFile) {
      toast({
        title: "Error",
        description: "Please select a video file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'url' && !formData.videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid video URL.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let videoUrl = formData.videoUrl;
      let thumbnailUrl = '';
      let fileSize = 0;
      let duration = 0;

      // Handle file upload
      if (uploadMethod === 'file' && formData.videoFile) {
        // Validate video orientation
        const orientationValidation = await validateVideoOrientation(formData.videoFile);
        if (!orientationValidation.isValid) {
          toast({
            title: "Invalid Video",
            description: orientationValidation.errors[0],
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Get duration
        duration = await getVideoDuration(formData.videoFile);
        fileSize = formData.videoFile.size;

        // Compress video if needed
        let videoToUpload = formData.videoFile;
        if (fileSize > 50 * 1024 * 1024) { // 50MB
          try {
            videoToUpload = await compressVideo(formData.videoFile, {
              maxSizeMB: 20,
              quality: 0.8
            });
            fileSize = videoToUpload.size;
            
            toast({
              title: "Video Compressed",
              description: "Your video was compressed to optimize upload speed and storage.",
            });
          } catch (compressionError) {
            console.error('Video compression failed:', compressionError);
            // Continue with original file if compression fails
          }
        }

        // Upload video file
        videoUrl = await uploadVideoFile(videoToUpload);

        // Generate and upload thumbnail
        let thumbnailFile = formData.thumbnailFile;
        if (!thumbnailFile) {
          thumbnailFile = await generateThumbnail(formData.videoFile);
        }
        
        if (thumbnailFile) {
          thumbnailUrl = await uploadThumbnail(thumbnailFile);
        }
      } else if (uploadMethod === 'url') {
        // Validate URL
        const urlValidation = validateVideoUrl(formData.videoUrl);
        if (!urlValidation.isValid) {
          toast({
            title: "Invalid URL",
            description: urlValidation.errors[0],
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Insert video record into database
      const videoData = {
        team_id: teamId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        match_date: formData.matchDate || null,
        opposing_team: formData.opposingTeam.trim() || null,
        home_or_away: formData.homeOrAway,
        final_score_home: formData.finalScoreHome ? parseInt(formData.finalScoreHome) : null,
        final_score_away: formData.finalScoreAway ? parseInt(formData.finalScoreAway) : null,
        video_type: formData.videoType,
        league_id: formData.leagueId || null,
        tagged_players: formData.taggedPlayers,
        tags: formData.tags,
        duration: Math.round(duration),
        file_size: fileSize,
        upload_status: 'completed',
        ai_analysis_status: 'pending',
        is_public: true
      };

      const { data: videoRecord, error: insertError } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save video information: ${insertError.message}`);
      }

      toast({
        title: "Success",
        description: "Video uploaded successfully and is now available for use in transfer pitches.",
      });

      onUploadComplete();
      onClose();

    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const togglePlayerTag = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      taggedPlayers: prev.taggedPlayers.includes(playerId)
        ? prev.taggedPlayers.filter(id => id !== playerId)
        : [...prev.taggedPlayers, playerId]
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-[#1a1a1a] border-rosegold/20">
      <CardHeader>
        <CardTitle className="text-white font-polysans text-2xl">Upload Video</CardTitle>
        <p className="text-gray-400 font-poppins">
          Add match footage with comprehensive data and player tagging
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Method Selection */}
          <div className="space-y-3">
            <Label className="text-white font-polysans">Upload Method</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={uploadMethod === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadMethod('file')}
                className={uploadMethod === 'file' ? 'bg-rosegold text-black' : ''}
              >
                Upload File
              </Button>
              <Button
                type="button"
                variant={uploadMethod === 'url' ? 'default' : 'outline'}
                onClick={() => setUploadMethod('url')}
                className={uploadMethod === 'url' ? 'bg-rosegold text-black' : ''}
              >
                Video URL
              </Button>
            </div>
          </div>

          {/* Video Upload/URL Input */}
          {uploadMethod === 'file' ? (
            <div className="space-y-3">
              <Label htmlFor="videoFile" className="text-white font-polysans">
                Video File (Landscape orientation required)
              </Label>
              <div className="border-2 border-dashed border-rosegold/30 rounded-lg p-6 text-center">
                {formData.videoFile ? (
                  <div className="space-y-3">
                    <Play className="w-12 h-12 mx-auto text-rosegold" />
                    <p className="text-white font-medium">{formData.videoFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, videoFile: null }))}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Video File
                      </Button>
                      <p className="text-gray-400 text-sm mt-2">
                        Max 100MB. Supported formats: MP4, MOV, AVI
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData(prev => ({ ...prev, videoFile: file }));
                  }
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="videoUrl" className="text-white font-polysans">
                Video URL
              </Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <p className="text-gray-400 text-sm">
                Supported platforms: YouTube, Vimeo, Streamable
              </p>
            </div>
          )}

          {/* Basic Video Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-white font-polysans">
                Video Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Match vs Arsenal - Goals & Highlights"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="videoType" className="text-white font-polysans">
                Video Type
              </Label>
              <Select 
                value={formData.videoType} 
                onValueChange={(value: 'highlight' | 'full_match' | 'training') => 
                  setFormData(prev => ({ ...prev, videoType: value }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highlight">Highlights</SelectItem>
                  <SelectItem value="full_match">Full Match</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-white font-polysans">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the match performance..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
            />
          </div>

          {/* Match Information */}
          <div className="space-y-4">
            <h3 className="text-white font-polysans text-lg">Match Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <Label htmlFor="matchDate" className="text-white font-polysans">
                  Match Date
                </Label>
                <Input
                  id="matchDate"
                  type="date"
                  value={formData.matchDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="opposingTeam" className="text-white font-polysans">
                  Opposing Team
                </Label>
                <Input
                  id="opposingTeam"
                  type="text"
                  placeholder="Liverpool FC"
                  value={formData.opposingTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, opposingTeam: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="homeOrAway" className="text-white font-polysans">
                  Home/Away
                </Label>
                <Select 
                  value={formData.homeOrAway} 
                  onValueChange={(value: 'home' | 'away') => 
                    setFormData(prev => ({ ...prev, homeOrAway: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <Label htmlFor="finalScoreHome" className="text-white font-polysans">
                  Final Score (Home)
                </Label>
                <Input
                  id="finalScoreHome"
                  type="number"
                  min="0"
                  placeholder="2"
                  value={formData.finalScoreHome}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalScoreHome: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="finalScoreAway" className="text-white font-polysans">
                  Final Score (Away)
                </Label>
                <Input
                  id="finalScoreAway"
                  type="number"
                  min="0"
                  placeholder="1"
                  value={formData.finalScoreAway}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalScoreAway: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="leagueId" className="text-white font-polysans">
                  League/Competition
                </Label>
                <Select 
                  value={formData.leagueId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, leagueId: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select league..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((league) => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name} ({league.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Player Tagging */}
          {players.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-polysans text-lg">Tag Players</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => togglePlayerTag(player.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.taggedPlayers.includes(player.id)
                        ? 'border-rosegold bg-rosegold/10 text-rosegold'
                        : 'border-gray-600 text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-sm">{player.full_name}</div>
                    <div className="text-xs opacity-75">{player.position}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-white font-polysans text-lg">Tags</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add a tag..."
                className="bg-gray-800 border-gray-600 text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Add a tag..."]') as HTMLInputElement;
                  if (input) {
                    addTag(input.value);
                    input.value = '';
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-rosegold/20 text-rosegold border-rosegold/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-rosegold/70 hover:text-rosegold"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rosegold hover:bg-rosegold/90 text-black font-polysans"
            >
              {loading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;
