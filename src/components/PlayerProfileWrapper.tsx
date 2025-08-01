
import React from 'react';
import PlayerProfileModal from './PlayerProfileModal';
import { usePlayerData } from '@/hooks/usePlayerData';

interface PlayerProfileWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName?: string;
  onMessagePlayer?: (playerId: string, playerName: string) => void;
}

export const PlayerProfileWrapper: React.FC<PlayerProfileWrapperProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  onMessagePlayer
}) => {
  const { player, loading, error } = usePlayerData(playerId);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto mb-2"></div>
          <p>Loading player data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 text-white max-w-md">
          <p className="text-red-400 mb-4">Error loading player: {error}</p>
          <button
            onClick={onClose}
            className="bg-rosegold text-black px-4 py-2 rounded hover:bg-rosegold/90"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <PlayerProfileModal
      isOpen={isOpen}
      onClose={onClose}
      player={player}
      onMessagePlayer={onMessagePlayer}
    />
  );
};

export default PlayerProfileWrapper;
