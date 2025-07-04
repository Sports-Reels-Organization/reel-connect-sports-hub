
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VideoPlayer from './VideoPlayer';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: string;
    title: string;
    video_url: string;
    opposing_team?: string;
    score?: string;
    tagged_players?: any;
  } | null;
  onPlayerTagClick?: (playerName: string) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  video,
  onPlayerTagClick
}) => {
  if (!video) return null;

  // Extract player tags from tagged_players
  const extractPlayerTags = (taggedPlayers: any): string[] => {
    if (!taggedPlayers) return [];
    if (Array.isArray(taggedPlayers)) {
      return taggedPlayers.map(player => 
        typeof player === 'string' ? player : player.name || 'Unknown Player'
      );
    }
    return [];
  };

  const metadata = {
    playerTags: extractPlayerTags(video.tagged_players),
    matchDetails: {
      homeTeam: 'Home Team', // Could be extracted from video metadata
      awayTeam: video.opposing_team || 'Away Team',
      league: 'League', // Could be extracted from video metadata
      finalScore: video.score || '0-0'
    },
    duration: 300 // Default duration, could be stored in video metadata
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-polysans text-2xl text-white">
            {video.title}
          </DialogTitle>
        </DialogHeader>
        
        <VideoPlayer
          videoUrl={video.video_url}
          title={video.title}
          metadata={metadata}
          onPlayerTagClick={onPlayerTagClick}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
