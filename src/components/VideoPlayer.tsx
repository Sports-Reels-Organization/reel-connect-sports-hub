
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume, VolumeOff, Fullscreen, SkipBack, SkipForward } from 'lucide-react';
import { analyzeVideo, VideoAnalysis } from '@/services/geminiService';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  metadata: {
    playerTags: string[];
    matchDetails: {
      homeTeam: string;
      awayTeam: string;
      league: string;
      finalScore: string;
    };
    duration: number;
  };
  onPlayerTagClick?: (playerName: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  metadata,
  onPlayerTagClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  useEffect(() => {
    if (metadata && !analysis.length && !isAnalyzing) {
      setIsAnalyzing(true);
      analyzeVideo(metadata).then(result => {
        setAnalysis(result);
        setIsAnalyzing(false);
      });
    }
  }, [metadata, analysis.length, isAnalyzing]);

  useEffect(() => {
    if (analysis.length > 0) {
      const current = analysis.find(a => 
        currentTime >= a.timestamp && 
        currentTime < (a.timestamp + (duration / analysis.length))
      );
      setCurrentAnalysis(current || null);
    }
  }, [currentTime, analysis, duration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const convertYouTubeUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {/* Video Player */}
      <div className="lg:col-span-2">
        <Card className="bg-[#1a1a1a] border-rosegold/20">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
              {isYouTubeUrl ? (
                <iframe
                  src={convertYouTubeUrl(videoUrl)}
                  title={title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}
            </div>

            {/* Custom Controls for non-YouTube videos */}
            {!isYouTubeUrl && (
              <div className="p-4 bg-[#1a1a1a]">
                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-rosegold"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => skip(-10)}
                      className="text-white hover:text-rosegold"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={togglePlay}
                      className="bg-rosegold hover:bg-rosegold/90 text-white"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => skip(10)}
                      className="text-white hover:text-rosegold"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-white hover:text-rosegold"
                    >
                      {isMuted ? <VolumeOff className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-rosegold"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleFullscreen}
                      className="text-white hover:text-rosegold"
                    >
                      <Fullscreen className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Metadata */}
            <div className="p-4 border-t border-gray-700">
              <h3 className="font-polysans text-xl font-bold text-white mb-3">{title}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 font-poppins">
                    <span className="text-white font-semibold">Match:</span> {metadata.matchDetails.homeTeam} vs {metadata.matchDetails.awayTeam}
                  </p>
                  <p className="text-gray-400 font-poppins">
                    <span className="text-white font-semibold">League:</span> {metadata.matchDetails.league}
                  </p>
                  <p className="text-gray-400 font-poppins">
                    <span className="text-white font-semibold">Final Score:</span> {metadata.matchDetails.finalScore}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 font-poppins mb-2">
                    <span className="text-white font-semibold">Tagged Players:</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {metadata.playerTags.map((player, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer border-rosegold text-rosegold hover:bg-rosegold hover:text-white transition-colors"
                        onClick={() => onPlayerTagClick && onPlayerTagClick(player)}
                      >
                        {player}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Panel */}
      <div className="lg:col-span-1">
        <Card className="bg-white border-rosegold/20 h-fit">
          <CardContent className="p-6">
            <h3 className="font-polysans text-xl font-bold text-black mb-4 border-b border-rosegold pb-2">
              AI Analysis
            </h3>

            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto mb-4"></div>
                <p className="text-gray-600 font-poppins">Analyzing video content...</p>
              </div>
            ) : currentAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-poppins font-semibold text-black mb-2">Player Actions</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {currentAnalysis.playerActions.map((action, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-rosegold rounded-full mr-2"></div>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-poppins font-semibold text-black mb-2">Match Events</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {currentAnalysis.matchEvents.map((event, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-bright-pink rounded-full mr-2"></div>
                        {event}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-poppins font-semibold text-black mb-2">Contextual Metrics</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {currentAnalysis.contextualMetrics.map((metric, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-rosegold/20">
                  <p className="text-xs text-gray-600 font-poppins">
                    Timestamp: {formatTime(currentAnalysis.timestamp)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 font-poppins">
                  Play the video to see AI analysis
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoPlayer;
