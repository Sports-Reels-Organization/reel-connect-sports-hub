
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  Video,
  FileText,
  Calendar,
  MapPin,
  Users,
  Trophy,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoUploadData {
  title: string;
  description: string;
  video_type: string;
  opposing_team?: string;
  match_date?: string;
  league?: string;
  home_or_away?: 'home' | 'away';
  final_score?: string;
  tagged_players: string[];
}

const EnhancedVideoUploadForm: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadData, setUploadData] = useState<VideoUploadData>({
    title: '',
    description: '',
    video_type: 'match',
    opposing_team: '',
    match_date: '',
    league: '',
    home_or_away: 'home',
    final_score: '',
    tagged_players: []
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setSelectedFile(file);
      if (!uploadData.title) {
        setUploadData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, "")
        }));
      }
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file",
        variant: "destructive"
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('match-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('match-videos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !profile) {
      toast({
        title: "Missing Information",
        description: "Please select a file and ensure you're logged in",
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

      // Upload file
      setUploadProgress(30);
      const videoUrl = await uploadFile(selectedFile);
      setUploadProgress(60);

      // Insert video record
      const { error } = await supabase
        .from('videos')
        .insert({
          team_id: teamData.id,
          title: uploadData.title,
          description: uploadData.description,
          video_url: videoUrl,
          video_type: uploadData.video_type,
          opposing_team: uploadData.opposing_team || null,
          match_date: uploadData.match_date || null,
          league: uploadData.league || null,
          home_or_away: uploadData.home_or_away || null,
          score_display: uploadData.final_score || null,
          tagged_players: uploadData.tagged_players,
          ai_analysis_status: 'pending',
          duration: 0,
          file_size: selectedFile.size
        });

      if (error) throw error;

      setUploadProgress(100);
      
      toast({
        title: "Video Uploaded Successfully",
        description: "Your video has been uploaded and is ready for analysis"
      });

      // Reset form
      setSelectedFile(null);
      setUploadData({
        title: '',
        description: '',
        video_type: 'match',
        opposing_team: '',
        match_date: '',
        league: '',
        home_or_away: 'home',
        final_score: '',
        tagged_players: []
      });
      setUploadProgress(0);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-bright-pink/20 rounded-lg">
              <Upload className="w-6 h-6 text-bright-pink" />
            </div>
            Upload Video
          </CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-bright-pink bg-bright-pink/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Video className="w-8 h-8 text-bright-pink" />
                    <div className="text-left">
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-gray-400">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-white font-medium mb-2">Drop your video file here</p>
                    <p className="text-gray-400 text-sm mb-4">or click to browse</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-bright-pink text-bright-pink hover:bg-bright-pink hover:text-white"
                    >
                      Choose File
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supported formats: MP4, MOV, AVI (Max size: 500MB)
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Video Details */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Video Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter video title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="video_type" className="text-white">Video Type *</Label>
                <Select 
                  value={uploadData.video_type} 
                  onValueChange={(value) => setUploadData(prev => ({ ...prev, video_type: value }))}
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

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                placeholder="Enter video description..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Match Details (only shown for match videos) */}
        {uploadData.video_type === 'match' && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Match Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opposing_team" className="text-white">Opposing Team</Label>
                  <Input
                    id="opposing_team"
                    value={uploadData.opposing_team}
                    onChange={(e) => setUploadData(prev => ({ ...prev, opposing_team: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter opposing team name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="match_date" className="text-white">Match Date</Label>
                  <Input
                    id="match_date"
                    type="date"
                    value={uploadData.match_date}
                    onChange={(e) => setUploadData(prev => ({ ...prev, match_date: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="league" className="text-white">League/Competition</Label>
                  <Input
                    id="league"
                    value={uploadData.league}
                    onChange={(e) => setUploadData(prev => ({ ...prev, league: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter league name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="home_away" className="text-white">Home/Away</Label>
                  <Select 
                    value={uploadData.home_or_away} 
                    onValueChange={(value: 'home' | 'away') => setUploadData(prev => ({ ...prev, home_or_away: value }))}
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
                
                <div>
                  <Label htmlFor="final_score" className="text-white">Final Score</Label>
                  <Input
                    id="final_score"
                    value={uploadData.final_score}
                    onChange={(e) => setUploadData(prev => ({ ...prev, final_score: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g., 2-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!selectedFile || uploading}
            className="bg-bright-pink hover:bg-bright-pink/90 text-white px-8"
          >
            {uploading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedVideoUploadForm;
