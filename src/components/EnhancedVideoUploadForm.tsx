import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { supabase } from '@/integrations/supabase/client';
import { analyzeVideoWithGemini } from '@/services/geminiAnalysisService';

interface EnhancedVideoUploadFormProps {
  onVideoUploaded?: (videoData: any) => void;
  teamId: string | null;
  defaultVideoType?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({
  onVideoUploaded,
  teamId,
  defaultVideoType = 'match',
  onSuccess,
  onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({});
  const [videoType, setVideoType] = useState<string>(defaultVideoType);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [matchDate, setMatchDate] = useState<Date | undefined>();
  const [homeOrAway, setHomeOrAway] = useState<string>('');
  const [opposingTeam, setOpposingTeam] = useState<string>('');
  const [league, setLeague] = useState<string>('');
  const [finalScore, setFinalScore] = useState<string>('');

  const triggerAIAnalysis = async (videoData: any) => {
    if (!teamId) return;

    try {
      console.log('Starting AI analysis for video:', videoData.id);
      
      const playerNames = taggedPlayers.map(player => player.trim()).filter(Boolean);
      
      const analysisParams = {
        playerTags: playerNames,
        videoType: videoType as 'match' | 'interview' | 'training' | 'highlight',
        videoTitle: title,
        videoDescription: description,
        duration: Math.floor(await getVideoDuration(selectedFile!)),
        opposingTeam: opposingTeam || undefined,
        playerStats: playerStats || undefined,
        matchDetails: videoType === 'match' && opposingTeam ? {
          homeTeam: homeOrAway === 'home' ? 'Your Team' : opposingTeam,
          awayTeam: homeOrAway === 'away' ? 'Your Team' : opposingTeam,
          league: league || 'Unknown League',
          finalScore: finalScore || 'N/A'
        } : undefined
      };

      const analysisResult = await analyzeVideoWithGemini(analysisParams);
      
      // Save analysis to database
      const { error: analysisError } = await supabase
        .from('enhanced_video_analysis')
        .upsert({
          video_id: videoData.id,
          analysis_status: analysisResult.analysisStatus,
          overall_assessment: analysisResult.summary,
          recommendations: analysisResult.recommendations,
          game_context: {
            key_highlights: analysisResult.keyHighlights,
            performance_metrics: analysisResult.performanceMetrics,
            video_type: videoType,
            analyzed_players: playerNames.join(', '),
            analysis_model: 'gemini-2.5-pro',
            analysis_timestamp: new Date().toISOString(),
            error_message: analysisResult.errorMessage
          }
        }, {
          onConflict: 'video_id'
        });

      if (analysisError) {
        console.error('Error saving analysis to database:', analysisError);
      } else {
        console.log('AI analysis completed and saved successfully');
      }

    } catch (error) {
      console.error('Error analyzing video with Gemini:', error);
      
      // Save failed analysis to database
      await supabase
        .from('enhanced_video_analysis')
        .upsert({
          video_id: videoData.id,
          analysis_status: 'failed',
          overall_assessment: null,
          recommendations: [],
          game_context: {
            error_message: error instanceof Error ? error.message : 'Unknown error occurred',
            failed_at: new Date().toISOString()
          }
        }, {
          onConflict: 'video_id'
        });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const compressVideo = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxWidth = 1280;
        const maxHeight = 720;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        video.width = width;
        video.height = height;

        ctx?.drawImage(video, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'video/mp4',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress video'));
          }
        }, 'video/mp4', 0.7);
        video.play();
      });

      video.addEventListener('error', (error) => {
        console.error('Video load error:', error);
        reject(new Error('Failed to load video'));
      });
    });
  };

  const generateThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg');
        resolve(thumbnail);
        video.play();
      });

      video.addEventListener('error', (error) => {
        console.error('Video load error:', error);
        reject(new Error('Failed to load video'));
      });
    });
  };

  const getVideoDuration = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);

      video.addEventListener('loadedmetadata', () => {
        resolve(video.duration);
      });

      video.addEventListener('error', (error) => {
        console.error('Video load error:', error);
        reject(new Error('Failed to load video duration'));
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !teamId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (selectedFile.size > 500 * 1024 * 1024) {
        throw new Error('File size exceeds 500MB. Please select a smaller file.');
      }

      // Compress video
      setProgressMessage('Compressing video...');
      const compressedFile = await compressVideo(selectedFile);
      setUploadProgress(20);

      // Upload compressed video
      setProgressMessage('Uploading video...');
      const videoFileName = `${Date.now()}-${compressedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('match-videos')
        .upload(videoFileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('match-videos')
        .getPublicUrl(videoFileName);

      setUploadProgress(60);

      // Generate thumbnail
      setProgressMessage('Generating thumbnail...');
      const thumbnailUrl = await generateThumbnail(compressedFile);
      setUploadProgress(70);

      // Get video duration
      const videoDuration = await getVideoDuration(compressedFile);
      const durationInSeconds = Math.floor(videoDuration);

      setProgressMessage('Saving video information...');

      const playerTagsData = taggedPlayers
        .map(player => player.trim())
        .filter(Boolean);

      const matchStatsData = playerStats ? 
        Object.fromEntries(
          Object.entries(playerStats).map(([playerName, stats]) => [
            playerName,
            stats
          ])
        ) : {};

      // Insert into match_videos table
      const { data: videoData, error: insertError } = await supabase
        .from('match_videos')
        .insert({
          team_id: teamId,
          title,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          compressed_video_url: publicUrl,
          duration: durationInSeconds,
          tagged_players: playerTagsData,
          match_stats: matchStatsData,
          match_date: matchDate?.toISOString().split('T')[0] || null,
          home_or_away: homeOrAway || null,
          opposing_team: opposingTeam || '',
          league: league || '',
          final_score: finalScore || null,
          file_size: compressedFile.size,
          is_processed: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Also insert into videos table for compatibility
      await supabase
        .from('videos')
        .insert({
          team_id: teamId,
          title,
          description,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          compressed_video_url: publicUrl,
          duration: durationInSeconds,
          tagged_players: playerTagsData,
          video_type: videoType,
          file_size: compressedFile.size,
          is_processed: true
        });

      setUploadProgress(90);

      // Start AI analysis (don't wait for completion)
      setProgressMessage('Starting AI analysis...');
      triggerAIAnalysis(videoData);

      setUploadProgress(100);
      setProgressMessage('Upload complete!');

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setTaggedPlayers([]);
      setPlayerStats({});
      setVideoType('match');
      setMatchDate(undefined);
      setHomeOrAway('');
      setOpposingTeam('');
      setLeague('');
      setFinalScore('');

      if (onVideoUploaded) {
        onVideoUploaded(videoData);
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setProgressMessage('');
      }, 2000);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-gray-100 text-gray-900 shadow-md rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Upload Video</CardTitle>
        <CardDescription>Upload and analyze your sports videos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isUploading && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{progressMessage}</p>
            <Progress value={uploadProgress} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="video">Video File</Label>
          <Input type="file" id="video" accept="video/*" onChange={handleFileSelect} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taggedPlayers">Tagged Players (comma-separated)</Label>
          <Input
            type="text"
            id="taggedPlayers"
            value={taggedPlayers.join(', ')}
            onChange={(e) => setTaggedPlayers(e.target.value.split(',').map(p => p.trim()))}
            placeholder="Enter player names, separated by commas"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="playerStats">Player Statistics (JSON format)</Label>
          <Textarea
            id="playerStats"
            placeholder='e.g., { "Player 1": { "goals": 2, "assists": 1 }, "Player 2": { "tackles": 5 } }'
            value={JSON.stringify(playerStats, null, 2)}
            onChange={(e) => {
              try {
                const parsedStats = JSON.parse(e.target.value);
                setPlayerStats(parsedStats);
              } catch (parseError) {
                console.error('Invalid JSON format:', parseError);
                setError('Invalid JSON format for player statistics');
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoType">Video Type</Label>
          <Select value={videoType} onValueChange={setVideoType}>
            <SelectTrigger>
              <SelectValue placeholder="Select video type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Match</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="highlight">Highlight</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {videoType === 'match' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Match Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !matchDate && "text-muted-foreground"
                    )}
                  >
                    {matchDate ? (
                      format(matchDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="single"
                    selected={matchDate}
                    onSelect={setMatchDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Home or Away</Label>
              <Select value={homeOrAway} onValueChange={setHomeOrAway}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opposingTeam">Opposing Team</Label>
              <Input
                type="text"
                id="opposingTeam"
                value={opposingTeam}
                onChange={(e) => setOpposingTeam(e.target.value)}
                placeholder="Enter opposing team name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="league">League</Label>
              <Input
                type="text"
                id="league"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="Enter league name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalScore">Final Score</Label>
              <Input
                type="text"
                id="finalScore"
                value={finalScore}
                onChange={(e) => setFinalScore(e.target.value)}
                placeholder="Enter final score (e.g., 2-1)"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Button disabled={isUploading} onClick={handleSubmit} className="flex-1">
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
