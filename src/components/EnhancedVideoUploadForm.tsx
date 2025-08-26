
import React, { useState, useRef, useCallback } from 'react';
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
  X, 
  Play, 
  FileVideo, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface VideoFormData {
  title: string;
  description: string;
  opposing_team: string;
  match_date: string;
  league: string;
  home_or_away: 'home' | 'away';
  final_score: string;
  tagged_players: string[];
}

const EnhancedVideoUploadForm: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    opposing_team: '',
    match_date: '',
    league: 'professional',
    home_or_away: 'home',
    final_score: '',
    tagged_players: []
  });

  // League options mapping to database enum
  const leagueOptions = [
    { value: 'local', label: 'Local' },
    { value: 'amateur', label: 'Amateur' },
    { value: 'semi_professional', label: 'Semi-Professional' },
    { value: 'professional', label: 'Professional' },
    { value: 'youth', label: 'Youth' },
    { value: 'collegiate', label: 'Collegiate' },
    { value: 'international', label: 'International' },
    { value: 'regional', label: 'Regional' },
    { value: 'national', label: 'National' }
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    }
  }, [toast]);

  const handleFormChange = (field: keyof VideoFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `videos/${profile?.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('match-videos')
      .upload(filePath, file, {
        onUploadProgress: (progress) => {
          setUploadProgress((progress.loaded / progress.total) * 100);
        }
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('match-videos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile || !profile) {
      toast({
        title: "Missing Information",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.opposing_team) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Get team information
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamError) throw teamError;

      // Upload video file
      const videoUrl = await uploadToSupabase(selectedFile);
      
      setIsProcessing(true);
      
      // Create video record with proper enum value for league
      const videoData = {
        team_id: teamData.id,
        title: formData.title,
        description: formData.description,
        video_url: videoUrl,
        opposing_team: formData.opposing_team,
        match_date: formData.match_date,
        league: formData.league as "local" | "amateur" | "semi_professional" | "professional" | "youth" | "collegiate" | "international" | "regional" | "national",
        home_or_away: formData.home_or_away,
        final_score: formData.final_score ? parseFloat(formData.final_score) : null,
        tagged_players: formData.tagged_players,
        file_size: selectedFile.size,
        duration: 0, // Will be updated after processing
        ai_analysis_status: 'pending' as const
      };

      const { error: insertError } = await supabase
        .from('videos')
        .insert(videoData);

      if (insertError) throw insertError;

      toast({
        title: "Upload Successful",
        description: "Your video has been uploaded and is being processed"
      });

      // Reset form
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        opposing_team: '',
        match_date: '',
        league: 'professional',
        home_or_away: 'home',
        final_score: '',
        tagged_players: []
      });
      setUploadProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Match Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Video File</Label>
            
            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-rosegold transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileVideo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300 mb-2">Click to select a video file</p>
                <p className="text-sm text-gray-500">MP4, MOV, AVI up to 100MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileVideo className="w-8 h-8 text-rosegold" />
                    <div>
                      <p className="font-medium text-white">{selectedFile.name}</p>
                      <p className="text-sm text-gray-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {(isUploading || isProcessing) && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {isUploading ? 'Uploading...' : 'Processing...'}
                      </span>
                      <span className="text-sm text-gray-400">
                        {isUploading ? `${Math.round(uploadProgress)}%` : 'Please wait'}
                      </span>
                    </div>
                    <Progress value={isUploading ? uploadProgress : 50} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Match vs Team Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opposing_team">Opposing Team *</Label>
              <Input
                id="opposing_team"
                value={formData.opposing_team}
                onChange={(e) => handleFormChange('opposing_team', e.target.value)}
                placeholder="Opponent team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="match_date">Match Date</Label>
              <Input
                id="match_date"
                type="date"
                value={formData.match_date}
                onChange={(e) => handleFormChange('match_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="league">League</Label>
              <Select 
                value={formData.league} 
                onValueChange={(value) => handleFormChange('league', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select league" />
                </SelectTrigger>
                <SelectContent>
                  {leagueOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="home_away">Home/Away</Label>
              <Select 
                value={formData.home_or_away} 
                onValueChange={(value: 'home' | 'away') => handleFormChange('home_or_away', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="final_score">Final Score</Label>
              <Input
                id="final_score"
                value={formData.final_score}
                onChange={(e) => handleFormChange('final_score', e.target.value)}
                placeholder="e.g., 2-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Add any additional notes about the match..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-rosegold hover:bg-rosegold/90"
            disabled={!selectedFile || isUploading || isProcessing}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedVideoUploadForm;
