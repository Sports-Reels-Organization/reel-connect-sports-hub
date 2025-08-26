import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Upload,
  Video,
  Users,
  Calendar,
  MapPin,
  Trophy,
  Clock,
  FileVideo,
  CheckCircle,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';

interface EnhancedVideoUploadFormProps {
  onUploadComplete?: (videoId: string) => void;
  teamId?: string;
}

const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({
  onUploadComplete,
  teamId
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    videoDescription: '',
    videoType: 'match',
    opposingTeam: '',
    matchDate: '',
    league: '',
    homeOrAway: 'home',
    finalScore: '', // Keep as string
    taggedPlayers: [] as string[]
  });
  const [newPlayerTag, setNewPlayerTag] = useState('');

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

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a video file smaller than 100MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      
      // Auto-generate title from filename if empty
      if (!formData.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  const addPlayerTag = () => {
    if (newPlayerTag.trim() && !formData.taggedPlayers.includes(newPlayerTag.trim())) {
      setFormData(prev => ({
        ...prev,
        taggedPlayers: [...prev.taggedPlayers, newPlayerTag.trim()]
      }));
      setNewPlayerTag('');
    }
  };

  const removePlayerTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      taggedPlayers: prev.taggedPlayers.filter(t => t !== tag)
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get team ID if not provided
      let currentTeamId = teamId;
      if (!currentTeamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        if (!teamData) {
          throw new Error('No team found for user');
        }
        currentTeamId = teamData.id;
      }

      // Upload video file to storage
      const fileName = `${currentTeamId}/${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(fileName, selectedFile, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(uploadData.path);

      // Save video metadata to database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          team_id: currentTeamId,
          title: formData.title,
          description: formData.videoDescription,
          video_url: publicUrl,
          video_type: formData.videoType,
          opposing_team: formData.opposingTeam,
          match_date: formData.matchDate,
          league: formData.league,
          home_or_away: formData.homeOrAway,
          score_display: formData.finalScore, // Use score_display field
          tagged_players: formData.taggedPlayers,
          file_size: selectedFile.size,
          ai_analysis_status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Upload Successful",
        description: "Your video has been uploaded and is ready for analysis",
      });

      // Reset form
      setSelectedFile(null);
      setFormData({
        title: '',
        videoDescription: '',
        videoType: 'match',
        opposingTeam: '',
        matchDate: '',
        league: '',
        homeOrAway: 'home',
        finalScore: '',
        taggedPlayers: []
      });

      if (onUploadComplete && videoData) {
        onUploadComplete(videoData.id);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
        {/* File Selection */}
        <div className="space-y-4">
          <Label className="text-white">Select Video File</Label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            {selectedFile ? (
              <div className="space-y-2">
                <FileVideo className="w-12 h-12 text-bright-pink mx-auto" />
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Video className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-400">Click to select a video file</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Choose File
                </Button>
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

        {/* Video Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Video Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter video title"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Video Type</Label>
            <Select 
              value={formData.videoType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, videoType: value }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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

        {/* Match Details */}
        {formData.videoType === 'match' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Opposing Team</Label>
                <Input
                  value={formData.opposingTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, opposingTeam: e.target.value }))}
                  placeholder="Enter opposing team"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Match Date</Label>
                <Input
                  type="date"
                  value={formData.matchDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">League</Label>
                <Input
                  value={formData.league}
                  onChange={(e) => setFormData(prev => ({ ...prev, league: e.target.value }))}
                  placeholder="Enter league"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Home/Away</Label>
                <Select 
                  value={formData.homeOrAway} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, homeOrAway: value as 'home' | 'away' }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Final Score</Label>
                <Input
                  value={formData.finalScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalScore: e.target.value }))}
                  placeholder="e.g., 2-1"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-white">Description</Label>
          <Textarea
            value={formData.videoDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, videoDescription: e.target.value }))}
            placeholder="Enter video description"
            className="bg-gray-700 border-gray-600 text-white"
            rows={3}
          />
        </div>

        {/* Player Tags */}
        <div className="space-y-4">
          <Label className="text-white">Tagged Players</Label>
          
          <div className="flex gap-2">
            <Input
              value={newPlayerTag}
              onChange={(e) => setNewPlayerTag(e.target.value)}
              placeholder="Enter player name"
              className="bg-gray-700 border-gray-600 text-white flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addPlayerTag()}
            />
            <Button
              type="button"
              onClick={addPlayerTag}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {formData.taggedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.taggedPlayers.map((tag, index) => (
                <Badge key={index} variant="outline" className="border-bright-pink text-bright-pink">
                  {tag}
                  <button
                    onClick={() => removePlayerTag(tag)}
                    className="ml-2 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Uploading...</span>
              <span className="text-bright-pink text-sm">{uploadProgress.toFixed(0)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || !formData.title}
          className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white"
        >
          {uploading ? (
            <>
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
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
