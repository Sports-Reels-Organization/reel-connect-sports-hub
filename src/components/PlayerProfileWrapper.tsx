
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && playerId) {
      // Navigate to the player profile page instead of showing modal
      navigate(`/player/${playerId}`);
      onClose(); // Close any existing modal state
    }
  }, [isOpen, playerId, navigate, onClose]);

  // This component no longer renders a modal, just handles navigation
  return null;
};

export default PlayerProfileWrapper;
