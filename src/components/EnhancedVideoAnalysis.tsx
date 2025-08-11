
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, Pause, RotateCcw, FastForward, 
  ArrowLeft, Download, Share,
  Clock, User, MapPin, Trophy, Volume2, VolumeX
} from 'lucide-react';
import EnhancedAIAnalysisInterface from './EnhancedAIAnalysisInterface';
import { VideoAnalysisResult } from '@/services/enhancedVideoAnalysisService';

interface VideoMetadata {
  playerTags: string[];
  matchDetails: {
    homeTeam?: string;
    awayTeam?: string;
    opposingTeam?: string;
    matchDate?: string;
    league?: string;
    finalScore?: string;
  };
  duration: number;
  videoDescription?: string;
}

interface EnhancedVideoAnalysisProps {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  videoMetadata: VideoMetadata;
  onClose: () => void;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({
  videoId,
  videoUrl,
  videoTitle,
  videoMetadata,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult | null>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = duration * percent;
    seekTo(newTime);
  }, [duration, seekTo]);

  const handleAnalysisComplete = useCallback((results: VideoAnalysisResult) => {
    setAnalysisResults(results);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('play', () => setIsPlaying(true));
      video.addEventListener('pause', () => setIsPlaying(false));

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('play', () => setIsPlaying(true));
        video.removeEventListener('pause', () => setIsPlaying(false));
      };
    }
  }, [handleTimeUpdate, handleLoadedMetadata]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-polysans">{videoTitle}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(videoMetadata.duration)}
                </span>
                {videoMetadata.matchDetails.opposingTeam && (
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    vs {videoMetadata.matchDetails.opposingTeam}
                  </span>
                )}
                {videoMetadata.playerTags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {videoMetadata.playerTags.length} player{videoMetadata.playerTags.length !== 1 ? 's' : ''} tagged
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Video Player */}
        <div className="flex-1 p-6">
          <div className="relative bg-black rounded-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-[400px] object-contain"
              onClick={togglePlay}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="mb-3">
                <div 
                  className="w-full bg-gray-600 rounded-full h-1 cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="bg-bright-pink h-1 rounded-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekTo(Math.max(0, currentTime - 10))}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    <FastForward className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20 p-2"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
                
                <span className="text-sm text-white font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced AI Analysis Interface */}
          <EnhancedAIAnalysisInterface
            videoId={videoId}
            videoUrl={videoUrl}
            videoTitle={videoTitle}
            taggedPlayers={videoMetadata.playerTags}
            metadata={{
              duration: videoMetadata.duration,
              playerTags: videoMetadata.playerTags,
              matchDetails: videoMetadata.matchDetails
            }}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoAnalysis;
