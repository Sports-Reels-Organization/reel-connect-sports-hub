
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume, VolumeOff, Fullscreen, SkipBack, SkipForward, BarChart3, TrendingUp, Target } from 'lucide-react';
import { analyzeVideo, VideoAnalysis } from '@/services/geminiService';
import { getYouTubeVideoInfo, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/services/youtubeService';

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
  const [youTubeVideoInfo, setYouTubeVideoInfo] = useState<any>(null);

  useEffect(() => {
    const initializeVideo = async () => {
      const youTubeVideoId = extractYouTubeVideoId(videoUrl);
      if (youTubeVideoId) {
        const videoInfo = await getYouTubeVideoInfo(youTubeVideoId);
        setYouTubeVideoInfo(videoInfo);
      }
    };

    initializeVideo();
  }, [videoUrl]);

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
      const enhancedMetadata = {
        ...metadata,
        videoTitle: youTubeVideoInfo?.title || title,
        videoDescription: youTubeVideoInfo?.description || ''
      };

      analyzeVideo(enhancedMetadata).then(result => {
        setAnalysis(result);
        setIsAnalyzing(false);
      });
    }
  }, [metadata, analysis.length, isAnalyzing, youTubeVideoInfo, title]);

  useEffect(() => {
    if (analysis.length > 0) {
      const current = analysis.find(a =>
        currentTime >= a.timestamp &&
        currentTime < (a.timestamp + (duration / analysis.length))
      );
      setCurrentAnalysis(current || analysis[0]);
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

  const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const youTubeVideoId = extractYouTubeVideoId(videoUrl);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {/* Video Player */}
      <div className="lg:col-span-2">
        <Card className="bg-[#1a1a1a] border border-[#d4af37]/20 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-[#111111] overflow-hidden">
              {isYouTubeUrl && youTubeVideoId ? (
                <iframe
                  src={getYouTubeEmbedUrl(youTubeVideoId)}
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
              <div className="p-6 bg-[#1a1a1a] border-t border-[#d4af37]/20">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-[#111111] rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${(currentTime / duration) * 100}%, #111111 ${(currentTime / duration) * 100}%, #111111 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => skip(-10)}
                      className="text-white hover:text-[#d4af37] hover:bg-[#d4af37]/10"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={togglePlay}
                      className="bg-[#d4af37] hover:bg-[#d4af37]/90 text-black font-semibold"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => skip(10)}
                      className="text-white hover:text-[#d4af37] hover:bg-[#d4af37]/10"
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-white hover:text-[#d4af37] hover:bg-[#d4af37]/10"
                    >
                      {isMuted ? <VolumeOff className="w-5 h-5" /> : <Volume className="w-5 h-5" />}
                    </Button>
                    <div className="w-24">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-full h-2 bg-[#111111] rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${(isMuted ? 0 : volume) * 100}%, #111111 ${(isMuted ? 0 : volume) * 100}%, #111111 100%)`
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleFullscreen}
                      className="text-white hover:text-[#d4af37] hover:bg-[#d4af37]/10"
                    >
                      <Fullscreen className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Metadata */}
            <div className="p-6 border-t border-[#d4af37]/20 bg-[#1a1a1a]">
              <h3 className="font-polysans text-2xl font-bold text-white mb-4">{title}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <span className="text-[#d4af37] font-semibold mr-2">Match:</span>
                    <span>{metadata.matchDetails.homeTeam} vs {metadata.matchDetails.awayTeam}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <span className="text-[#d4af37] font-semibold mr-2">League:</span>
                    <span>{metadata.matchDetails.league}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <span className="text-[#d4af37] font-semibold mr-2">Final Score:</span>
                    <span className="text-pink-400 font-bold">{metadata.matchDetails.finalScore}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-300 mb-3">
                    <span className="text-[#d4af37] font-semibold">Featured Players:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {metadata.playerTags.map((player, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-200 font-medium"
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

      {/* Enhanced AI Analysis Panel */}
      <div className="lg:col-span-1">
        <Card className="bg-white border border-[#d4af37]/30 shadow-lg">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-[#d4af37] to-pink-400 p-4">
              <h3 className="font-polysans text-xl font-bold text-black flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                AI Match Analysis
              </h3>

            </div>

            <div className="p-6">
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-[#d4af37]" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-poppins font-medium">Analyzing video content...</p>
                  <p className="text-gray-400 text-sm font-poppins mt-1">Processing player actions and match events</p>
                </div>
              ) : currentAnalysis ? (
                <div className="space-y-6">
                  {/* Performance Rating */}
                  <div className="bg-gradient-to-r from-[#d4af37]/10 to-pink-400/10 rounded-lg p-4 border border-[#d4af37]/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-poppins font-semibold text-black">Performance Rating</span>
                      <span className="text-2xl font-bold text-[#d4af37]">{currentAnalysis.performanceRating.toFixed(1)}/10</span>
                    </div>
                    <Progress
                      value={currentAnalysis.performanceRating * 10}
                      className="h-2"
                    />
                  </div>

                  {/* Player Actions */}
                  <div className="space-y-3">
                    <h4 className="font-poppins font-bold text-black flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#d4af37]" />
                      Player Actions
                    </h4>
                    <div className="space-y-2">
                      {currentAnalysis.playerActions.map((action, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-[#d4af37]">
                          <div className="w-2 h-2 bg-[#d4af37] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-800 font-poppins">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Analysis */}
                  <div className="space-y-3">
                    <h4 className="font-poppins font-bold text-black flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-pink-500" />
                      Technical Analysis
                    </h4>
                    <div className="space-y-2">
                      {currentAnalysis.technicalAnalysis.map((analysis, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg border-l-4 border-pink-400">
                          <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-800 font-poppins">{analysis}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Match Events */}
                  <div className="space-y-3">
                    <h4 className="font-poppins font-bold text-black">Match Events</h4>
                    <div className="space-y-2">
                      {currentAnalysis.matchEvents.map((event, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 font-poppins">{event}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Insights */}
                  <div className="space-y-3">
                    <h4 className="font-poppins font-bold text-black">Tactical Insights</h4>
                    <div className="space-y-2">
                      {currentAnalysis.tacticalInsights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 font-poppins">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contextual Metrics */}
                  <div className="space-y-3">
                    <h4 className="font-poppins font-bold text-black">Performance Metrics</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {currentAnalysis.contextualMetrics.map((metric, index) => (
                        <div key={index} className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-800 font-poppins font-medium">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-6 p-3 bg-gradient-to-r from-[#d4af37]/10 to-pink-400/10 rounded-lg border border-[#d4af37]/20 text-center">
                    <p className="text-xs text-gray-600 font-poppins">
                      Analysis for timestamp: <span className="font-semibold text-[#d4af37]">{formatTime(currentAnalysis.timestamp)}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 font-poppins font-medium">
                    Play the video to see AI analysis
                  </p>
                  <p className="text-gray-400 text-sm font-poppins mt-1">
                    Detailed insights will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoPlayer;
