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
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Listbox } from '@headlessui/react'
import { supabase } from '@/integrations/supabase/client';

interface EnhancedVideoUploadFormProps {
  onVideoUploaded?: (videoData: any) => void;
  teamId: string | null;
  defaultVideoType?: string;
}

export const EnhancedVideoUploadForm: React.FC<EnhancedVideoUploadFormProps> = ({
  onVideoUploaded,
  teamId,
  defaultVideoType = 'match'
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
      
      // Get player names from taggedPlayers (they should be names, not IDs)
      const playerNames = taggedPlayers.map(player => player.trim()).filter(Boolean);
      
      const analysisPayload = {
        videoId: videoData.id,
        videoUrl: videoData.video_url,
        videoType: videoType,
        videoTitle: title,
        videoDescription: description,
        opposingTeam: opposingTeam || 'Unknown',
        playerStats: playerStats || {},
        taggedPlayers: playerNames // Use actual player names
      };

      console.log('Analysis payload:', analysisPayload);

      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: analysisPayload
      });

      if (error) {
        console.error('Analysis function error:', error);
        throw error;
      }

      console.log('AI analysis completed:', data);
    } catch (error) {
      console.error('Error analyzing video with Gemini:', error);
      // Don't throw error - video upload should continue even if analysis fails
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

      // Prepare tagged players as names (not IDs)
      const playerTagsData = taggedPlayers
        .map(player => player.trim())
        .filter(Boolean);

      // Prepare match statistics with player names
      const matchStatsData = playerStats ? 
        Object.fromEntries(
          Object.entries(playerStats).map(([playerName, stats]) => [
            playerName, // Use player name as key
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
          match_date: matchDate || null,
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
      setMatchDate('');
      setHomeOrAway('');
      setOpposingTeam('');
      setLeague('');
      setFinalScore('');

      if (onVideoUploaded) {
        onVideoUploaded(videoData);
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
        <Button disabled={isUploading} onClick={handleSubmit}>
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </Button>
      </CardFooter>
    </Card>
  );
};
