import React, { useState, useRef, useEffect } from 'react';
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
import { Upload, X, Play, FileVideo, Loader2, User, ArrowLeft } from 'lucide-react';
import { EnhancedPlayerTagging } from './EnhancedPlayerTagging';
import { smartCompress } from '@/services/fastVideoCompressionService';
import { analyzeVideoWithGemini } from '@/services/geminiAnalysisService';

interface PlayerWithJersey {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
}

interface EnhancedVideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<'match' | 'interview' | 'training' | 'highlight'>('match');
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerWithJersey[]>([]);
  
  // Match-specific fields
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [finalScore, setFinalScore] = useState('');
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'idle' | 'compressing' | 'uploading' | 'analyzing'>('idle');
  
  // Preview state
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = url;
      
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Video file must be under 500MB",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const removeFile = () => {
    setFile(null);
    setVideoPreview(null);
    setVideoDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a video file to upload",
        variant: "destructive"
      });
      return false;
    }

    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your video",
        variant: "destructive"
      });
      return false;
    }

    if (videoType === 'match') {
      if (!homeTeam.trim() || !awayTeam.trim()) {
        toast({
          title: "Missing Match Details",
          description: "Please enter both home and away team names for match videos",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm() || !file || !profile?.id) return;

    setIsUploading(true);
    setCurrentStep('compressing');

    try {
      // Step 1: Compress video
      const compressedFile = await smartCompress(file);
      setCompressionProgress(100);

      setCurrentStep('uploading');

      // Step 2: Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(100);

      // Get the public URL for the uploaded video
      const { data: urlData } = supabase.storage
        .from('match-videos')
        .getPublicUrl(filePath);

      // Step 3: Get the user's team ID
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamError) throw new Error('Could not find team for user');

      // Step 4: Save video metadata to the correct table
      let videoData;
      
      if (videoType === 'match') {
        // Insert into match_videos table for match videos
        const { data, error: dbError } = await supabase
          .from('match_videos')
          .insert({
            title,
            video_url: urlData.publicUrl,
            file_size: compressedFile.size,
            duration: Math.floor(videoDuration),
            team_id: teamData.id,
            tagged_players: selectedPlayers.map(p => ({
              playerId: p.playerId,
              playerName: p.playerName,
              jerseyNumber: p.jerseyNumber
            })),
            opposing_team: awayTeam,
            league: 'Unknown',
            final_score: finalScore,
            match_date: new Date().toISOString().split('T')[0],
            ai_analysis_status: 'pending'
          })
          .select()
          .single();

        if (dbError) throw dbError;
        videoData = data;
      } else {
        // Insert into videos table for non-match videos
        const { data, error: dbError } = await supabase
          .from('videos')
          .insert({
            title,
            description,
            video_type: videoType,
            video_url: urlData.publicUrl,
            file_size: compressedFile.size,
            duration: Math.floor(videoDuration),
            team_id: teamData.id,
            tagged_players: selectedPlayers.map(p => p.playerId),
            is_public: false,
            ai_analysis_status: 'pending'
          })
          .select()
          .single();

        if (dbError) throw dbError;
        videoData = data;
      }

      // Step 5: Start AI Analysis using Gemini service
      setCurrentStep('analyzing');
      
      try {
        const analysisResult = await analyzeVideoWithGemini({
          videoId: videoData.id,
          videoUrl: urlData.publicUrl,
          videoType,
          videoTitle: title,
          videoDescription: description,
          opposingTeam: videoType === 'match' ? awayTeam : undefined,
          taggedPlayers: selectedPlayers,
          finalScore: videoType === 'match' ? finalScore : undefined
        });

        // Update the video record with analysis results
        const tableName = videoType === 'match' ? 'match_videos' : 'videos';
        
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            ai_analysis: analysisResult,
            ai_analysis_status: 'completed'
          })
          .eq('id', videoData.id);

        if (updateError) {
          console.error('Error saving analysis to database:', updateError);
          // Update status to failed if we can't save
          await supabase
            .from(tableName)
            .update({ ai_analysis_status: 'failed' })
            .eq('id', videoData.id);
        }

        console.log('Analysis completed and saved:', analysisResult);
      } catch (analysisError: any) {
        console.error('AI analysis failed:', analysisError);
        
        // Update status to failed
        const tableName = videoType === 'match' ? 'match_videos' : 'videos';
        await supabase
          .from(tableName)
          .update({ 
            ai_analysis_status: 'failed',
            ai_analysis: {
              error_message: analysisError.message,
              analyzed_at: new Date().toISOString(),
              model_used: 'gemini-2.0-flash-exp'
            }
          })
          .eq('id', videoData.id);
      }

      setAnalysisProgress(100);

      toast({
        title: "Upload Successful",
        description: "Your video has been uploaded and AI analysis is complete!",
      });

      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setCurrentStep('idle');
      setUploadProgress(0);
      setCompressionProgress(0);
      setAnalysisProgress(0);
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'compressing':
        return compressionProgress;
      case 'uploading':
        return uploadProgress;
      case 'analyzing':
        return analysisProgress;
      default:
        return 0;
    }
  };

  const getStepText = () => {
    switch (currentStep) {
      case 'compressing':
        return 'Compressing video...';
      case 'uploading':
        return 'Uploading video...';
      case 'analyzing':
        return 'Analyzing with AI...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">Upload Video</h1>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileVideo className="w-5 h-5 text-bright-pink" />
            Video Upload & Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            {!file ? (
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-bright-pink transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-white mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-400">
                  MP4, MOV, AVI up to 500MB
                </p>
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
                  {videoPreview && (
                    <video
                      ref={videoRef}
                      src={videoPreview}
                      controls
                      className="w-full max-h-64 object-contain"
                    />
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={removeFile}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* File Info */}
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileVideo className="w-5 h-5 text-bright-pink" />
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-sm text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                        {videoDuration > 0 && ` • ${Math.floor(videoDuration / 60)}:${Math.floor(videoDuration % 60).toString().padStart(2, '0')}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Type *
                </label>
                <Select value={videoType} onValueChange={(value: any) => setVideoType(value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="highlight">Highlight Reel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the video content..."
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>

            {/* Match-specific fields */}
            {videoType === 'match' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Home Team *
                  </label>
                  <Input
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="Home team name"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Away Team *
                  </label>
                  <Input
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="Away team name"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Final Score
                  </label>
                  <Input
                    value={finalScore}
                    onChange={(e) => setFinalScore(e.target.value)}
                    placeholder="2-1"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            {/* Player Tagging */}
            <EnhancedPlayerTagging
              selectedPlayers={selectedPlayers}
              onPlayersChange={setSelectedPlayers}
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3 p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    {getStepText()}
                  </span>
                  <span className="text-sm text-gray-400">
                    {Math.round(getStepProgress())}%
                  </span>
                </div>
                <Progress value={getStepProgress()} className="w-full" />
                
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${currentStep === 'compressing' ? 'bg-bright-pink animate-pulse' : compressionProgress === 100 ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span>Compression</span>
                  
                  <div className={`w-2 h-2 rounded-full ${currentStep === 'uploading' ? 'bg-bright-pink animate-pulse' : uploadProgress === 100 ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span>Upload</span>
                  
                  <div className={`w-2 h-2 rounded-full ${currentStep === 'analyzing' ? 'bg-bright-pink animate-pulse' : analysisProgress === 100 ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span>AI Analysis</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isUploading}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={!file || isUploading}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {getStepText()}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
