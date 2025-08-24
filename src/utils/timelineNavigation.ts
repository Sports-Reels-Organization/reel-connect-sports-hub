
import { useNavigate } from 'react-router-dom';

export const useTimelineNavigation = () => {
  const navigate = useNavigate();

  const navigateToPlayerProfile = (playerId: string, playerName?: string) => {
    navigate(`/player-profile/${playerId}`, {
      state: { playerName }
    });
  };

  const navigateToMatchVideo = (videoId: string, matchTitle?: string) => {
    navigate(`/videos`, {
      state: { 
        highlightVideoId: videoId,
        searchTerm: matchTitle 
      }
    });
  };

  const navigateToTeamProfile = () => {
    navigate('/profile');
  };

  const navigateToTransferPitch = (pitchId: string) => {
    navigate('/explore', {
      state: { highlightPitchId: pitchId }
    });
  };

  return {
    navigateToPlayerProfile,
    navigateToMatchVideo,
    navigateToTeamProfile,
    navigateToTransferPitch
  };
};
