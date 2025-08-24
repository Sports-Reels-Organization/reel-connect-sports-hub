
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      // Close any existing modal and navigate to player page
      onClose();
      navigate(`/players/${playerId}`);
    }
  }, [isOpen, playerId, navigate, onClose]);

  // This component now just handles the redirect, no UI needed
  return null;
};

export default PlayerProfileWrapper;
