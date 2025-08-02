
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Video, X, Plus, Loader2 } from 'lucide-react';
import { useDataChangeNotification } from '@/hooks/useDataChangeNotification';
import { FastVideoCompressionService } from '@/services/fastVideoCompressionService';

interface VideoUploadFormProps {
  onClose: () => void;
}

interface SelectedPlayer {
  id: string;
  full_name: string;
  position: string;
}

export default function VideoUploadForm({ onClose }: VideoUploadFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { sendChangeNotification } = useDataChangeNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    opposing_team: '',
    score: '',
    match_date: '',
    home_or_away: 'home',
    video_type: 'highlight',
    tags: [] as string[],
    taggedPlayers: [] as SelectedPlayer[]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentTag, setCurrentTag] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState<SelectedPlayer[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);

  React.useEffect(() => {
    fetchTeamAndPlayers();
  }, [profile]);

  const fetchTeamAndPlayers = async () => {
    if (!profile) return;

    try {
      // Get team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamError) throw teamError;
      
      setTeamId(team.id);

      // Get players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, full_name, position')
        .eq('team_id', team.id);

      if (playersError) throw playersError;
      setAvailablePlayers(players || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please select a video file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const compressVideo = async (file: File): Promise<File> => {
    setCompressing(true);
    try {
      const compressionService = new FastVideoCompressionService();
      const compressedFile = await compressionService.compressVideo(file, {
        quality: 0.7,
        maxWidth: 1280,
        maxHeight: 720
      });
      return compressedFile;
    } catch (error) {
      console.error('Video compression failed:', error);
      return file; // Return original file if compression fails
    } finally {
      setCompressing(false);
    }
  };

  const uploadToSupabase = async (file: File, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('match-videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !teamId) {
      toast({
        title: "Missing Information",
        description: "Please select a video file and ensure your team is set up.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your video.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Compress video
      const processedFile = await compressVideo(selectedFile);
      setUploadProgress(30);

      // Upload to storage
      const fileName = `${teamId}/${Date.now()}-${processedFile.name}`;
      const uploadData = await uploadToSupabase(processedFile, fileName);
      setUploadProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(uploadData.path);

      // Save to database
      const { data: video, error: dbError } = await supabase
        .from('videos')
        .insert({
          team_id: teamId,
          title: formData.title,
          description: formData.description,
          video_url: urlData.publicUrl,
          opposing_team: formData.opposing_team,
          score: formData.score,
          match_date: formData.match_date || null,
          home_or_away: formData.home_or_away,
          video_type: formData.video_type,
          tags: formData.tags,
          tagged_players: formData.taggedPlayers.map(p => p.id),
          duration: 0,
          file_size: processedFile.size,
          upload_status: 'completed',
          ai_analysis_status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);

      // Send notification
      if (profile?.email) {
        await sendChangeNotification({
          userId: profile.user_id,
          email: profile.email,
          changeType: 'uploaded',
          entityType: 'video',
          entityName: formData.title
        });
      }

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addPlayer = (playerId: string) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (player && !formData.taggedPlayers.find(p => p.id === playerId)) {
      setFormData(prev => ({
        ...prev,
        taggedPlayers: [...prev.taggedPlayers, player]
      }));
    }
  };

  const removePlayer = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      taggedPlayers: prev.taggedPlayers.filter(p => p.id !== playerId)
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-rosegold flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Match Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Select Video File</Label>
            <div 
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-rosegold transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <Video className="w-8 h-8 mx-auto text-rosegold" />
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-gray-400">Click to select video file</p>
                  <p className="text-xs text-gray-500">Max size: 100MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                className="bg-gray-800 border-gray-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_type">Video Type</Label>
              <Select value={formData.video_type} onValueChange={(value) => setFormData(prev => ({ ...prev, video_type: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highlight">Highlight</SelectItem>
                  <SelectItem value="full_match">Full Match</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the video content..."
              className="bg-gray-800 border-gray-600"
              rows={3}
            />
          </div>

          {/* Match Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opposing_team">Opposing Team</Label>
              <Input
                id="opposing_team"
                value={formData.opposing_team}
                onChange={(e) => setFormData(prev => ({ ...prev, opposing_team: e.target.value }))}
                placeholder="Team name"
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Final Score</Label>
              <Input
                id="score"
                value={formData.score}
                onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                placeholder="2-1"
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home_or_away">Home/Away</Label>
              <Select value={formData.home_or_away} onValueChange={(value) => setFormData(prev => ({ ...prev, home_or_away: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="match_date">Match Date</Label>
            <Input
              id="match_date"
              type="date"
              value={formData.match_date}
              onChange={(e) => setFormData(prev => ({ ...prev, match_date: e.target.value }))}
              className="bg-gray-800 border-gray-600"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                className="bg-gray-800 border-gray-600"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tagged Players */}
          <div className="space-y-2">
            <Label>Tag Players</Label>
            <Select onValueChange={addPlayer}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Select players to tag" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers
                  .filter(player => !formData.taggedPlayers.find(p => p.id === player.id))
                  .map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.full_name} - {player.position}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            {formData.taggedPlayers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.taggedPlayers.map(player => (
                  <Badge key={player.id} variant="outline" className="flex items-center gap-1">
                    {player.full_name}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removePlayer(player.id)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {(uploading || compressing) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {compressing ? 'Compressing video...' : 'Uploading...'}
                </span>
                <span className="text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-rosegold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={uploading || compressing || !selectedFile}
              className="flex-1 bg-rosegold hover:bg-rosegold/90 text-black"
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
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading || compressing}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
