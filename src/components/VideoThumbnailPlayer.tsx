
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume, VolumeOff, Maximize, Calendar, Trophy, Users, Clock } from 'lucide-react';

interface VideoThumbnailPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  videoType: 'match' | 'training' | 'highlight' | 'interview';
  metadata: {
    opposingTeam?: string;
    matchDate?: string;
    score?: string;
    duration?: number;
    teamName?: string;
  };
  className?: string;
  onPlay?: () => void;
}

export const VideoThumbnailPlayer: React.FC<VideoThumbnailPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  videoType,
  metadata,
  className = '',
  onPlay
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlayClick = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
        if (onPlay) onPlay();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Video play error:', error);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume > 0 ? volume : 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVideoTypeColor = (type: string) => {
    switch (type) {
      case 'match': return 'bg-green-600';
      case 'training': return 'bg-blue-600';
      case 'highlight': return 'bg-purple-600';
      case 'interview': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getVideoTypeDisplay = (type: string) => {
    switch (type) {
      case 'match': return 'Match Video';
      case 'training': return 'Training Session';
      case 'highlight': return 'Highlight Reel';
      case 'interview': return 'Interview';
      default: return 'Video';
    }
  };

  return (
    <Card className={`bg-gray-900 border-gray-700 overflow-hidden ${className}`}>
      <div 
        className="relative aspect-video bg-black group cursor-pointer"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
          playsInline
        />

        {/* Play Button Overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-200"
            onClick={handlePlayClick}
          >
            <Button 
              size="lg"
              className="bg-bright-pink hover:bg-bright-pink/90 text-white rounded-full p-4"
            >
              <Play className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* Video Controls */}
        {isPlaying && showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (video) {
                    video.currentTime = parseFloat(e.target.value);
                  }
                }}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-1">
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
                  onClick={handlePlayClick}
                  className="text-white hover:bg-white/10"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/10"
                >
                  {isMuted ? <VolumeOff className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const video = videoRef.current;
                    if (video && video.requestFullscreen) {
                      video.requestFullscreen();
                    }
                  }}
                  className="text-white hover:bg-white/10"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getVideoTypeColor(videoType)} text-white font-medium px-2 py-1`}>
            {getVideoTypeDisplay(videoType)}
          </Badge>
        </div>
      </div>

      {/* Video Information */}
      <CardContent className="p-4">
        <h3 className="text-white font-semibold text-lg mb-3 line-clamp-2">{title}</h3>
        
        <div className="space-y-2 text-sm text-gray-300">
          {/* Match-specific information */}
          {videoType === 'match' && (
            <>
              {metadata.teamName && metadata.opposingTeam && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-bright-pink" />
                  <span>{metadata.teamName} vs {metadata.opposingTeam}</span>
                </div>
              )}
              
              {metadata.score && (
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-bright-pink" />
                  <span>Final Score: <span className="text-bright-pink font-medium">{metadata.score}</span></span>
                </div>
              )}
              
              {metadata.matchDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-bright-pink" />
                  <span>{new Date(metadata.matchDate).toLocaleDateString()}</span>
                </div>
              )}
            </>
          )}

          {/* General video information */}
          {metadata.teamName && videoType !== 'match' && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-bright-pink" />
              <span>{metadata.teamName}</span>
            </div>
          )}

          {metadata.duration && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-bright-pink" />
              <span>{formatTime(metadata.duration)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoThumbnailPlayer;
