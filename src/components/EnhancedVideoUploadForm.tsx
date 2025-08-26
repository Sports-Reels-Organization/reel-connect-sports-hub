
import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Upload, 
  X, 
  Play, 
  FileVideo, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

interface EnhancedVideoUploadFormProps {
  teamId: string;
  onUploadComplete: () => void;
}

interface VideoFile extends File {
  id: string;
  preview: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({
  teamId,
  onUploadComplete
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    videoType: 'highlight',
    opposingTeam: '',
    homeOrAway: '',
    matchDate: '',
    leagueId: ''
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newVideoFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      uploadProgress: 0,
      status: 'pending' as const
    }));
    
    setVideoFiles(prev => [...prev, ...newVideoFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    },
    multiple: true,
    maxSize: 500 * 1024 * 1024 // 500MB
  });

  const removeFile = (fileId: string) => {
    setVideoFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const uploadSingleVideo = async (videoFile: VideoFile) => {
    try {
      setVideoFiles(prev => prev.map(f => 
        f.id === videoFile.id ? { ...f, status: 'uploading' } : f
      ));

      const fileName = `${teamId}/${Date.now()}-${videoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(fileName);

      // Get video duration (simplified approach)
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const duration = await new Promise<number>((resolve) => {
        video.onloadedmetadata = () => resolve(Math.round(video.duration));
        video.src = videoFile.preview;
      });

      setVideoFiles(prev => prev.map(f => 
        f.id === videoFile.id ? { ...f, status: 'processing' } : f
      ));

      // Insert video record into database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          team_id: teamId,
          title: formData.title || videoFile.name,
          description: formData.description,
          video_url: publicUrl,
          video_type: formData.videoType,
          duration: duration,
          file_size: videoFile.size,
          tags: formData.tags,
          opposing_team: formData.opposingTeam,
          home_or_away: formData.homeOrAway,
          match_date: formData.matchDate || null,
          league_id: formData.leagueId || null,
          upload_status: 'completed',
          ai_analysis_status: 'pending',
          compression_status: 'pending'
        });

      if (dbError) throw dbError;

      setVideoFiles(prev => prev.map(f => 
        f.id === videoFile.id ? { ...f, status: 'completed', uploadProgress: 100 } : f
      ));

      toast({
        title: "Upload Successful",
        description: `${videoFile.name} has been uploaded successfully`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      setVideoFiles(prev => prev.map(f => 
        f.id === videoFile.id ? { 
          ...f, 
          status: 'error', 
          error: error.message || 'Upload failed' 
        } : f
      ));

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${videoFile.name}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = videoFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploadingCount(pendingFiles.length);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadSingleVideo(file);
    }

    setUploadingCount(0);
    onUploadComplete();
  };

  const getStatusIcon = (status: VideoFile['status']) => {
    switch (status) {
      case 'pending': return <FileVideo className="w-4 h-4 text-gray-400" />;
      case 'uploading': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'processing': return <Settings className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: VideoFile['status']) => {
    switch (status) {
      case 'pending': return 'Ready to upload';
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'completed': return 'Upload complete';
      case 'error': return 'Upload failed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Configuration */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="text-white font-polysans">Video Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-gray-300">Video Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="videoType" className="text-gray-300">Video Type</Label>
              <Select value={formData.videoType} onValueChange={(value) => setFormData(prev => ({ ...prev, videoType: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select video type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highlight">Highlight</SelectItem>
                  <SelectItem value="match">Full Match</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="opposingTeam" className="text-gray-300">Opposing Team</Label>
              <Input
                id="opposingTeam"
                value={formData.opposingTeam}
                onChange={(e) => setFormData(prev => ({ ...prev, opposingTeam: e.target.value }))}
                placeholder="Enter opposing team name"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="homeOrAway" className="text-gray-300">Home/Away</Label>
              <Select value={formData.homeOrAway} onValueChange={(value) => setFormData(prev => ({ ...prev, homeOrAway: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="matchDate" className="text-gray-300">Match Date</Label>
              <Input
                id="matchDate"
                type="date"
                value={formData.matchDate}
                onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter video description"
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="text-white font-polysans">Upload Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-white mb-2">
              {isDragActive ? 'Drop videos here' : 'Drag & drop videos here'}
            </p>
            <p className="text-gray-400 mb-4">
              or click to browse files
            </p>
            <p className="text-sm text-gray-500">
              Supports: MP4, AVI, MOV, WMV, FLV, WebM, MKV (Max: 500MB per file)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {videoFiles.length > 0 && (
        <Card className="border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-polysans">
                Selected Videos ({videoFiles.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setVideoFiles([])}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleUploadAll}
                  disabled={uploadingCount > 0 || videoFiles.filter(f => f.status === 'pending').length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {uploadingCount > 0 ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading ({uploadingCount})
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videoFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                  <div className="w-16 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    <video
                      src={file.preview}
                      className="w-full h-full object-cover"
                      muted
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.uploadProgress} className="mt-2" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <span className="text-sm text-gray-300">
                      {getStatusText(file.status)}
                    </span>
                  </div>
                  
                  {file.error && (
                    <div className="text-xs text-red-400 max-w-32 truncate" title={file.error}>
                      {file.error}
                    </div>
                  )}
                  
                  {file.status !== 'uploading' && file.status !== 'processing' && (
                    <Button
                      onClick={() => removeFile(file.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVideoUploadForm;
