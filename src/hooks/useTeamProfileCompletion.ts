
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamCompletionStatus {
  isTeamProfileComplete: boolean;
  hasMinimumPlayers: boolean;
  hasMinimumVideos: boolean;
  canAccessFeatures: boolean;
  missingRequirements: string[];
  teamData: any;
  playerCount: number;
  videoCount: number;
}

export const useTeamProfileCompletion = () => {
  const { profile } = useAuth();
  const [completionStatus, setCompletionStatus] = useState<TeamCompletionStatus>({
    isTeamProfileComplete: false,
    hasMinimumPlayers: false,
    hasMinimumVideos: false,
    canAccessFeatures: false,
    missingRequirements: [],
    teamData: null,
    playerCount: 0,
    videoCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_type === 'team') {
      checkTeamCompletion();
    }
  }, [profile]);

  const checkTeamCompletion = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const missingRequirements: string[] = [];

      // 1. Check team profile completion
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          profiles!inner(verified)
        `)
        .eq('profile_id', profile.id)
        .single();

      if (teamError || !teamData) {
        missingRequirements.push('Team profile must be created');
        setCompletionStatus({
          isTeamProfileComplete: false,
          hasMinimumPlayers: false,
          hasMinimumVideos: false,
          canAccessFeatures: false,
          missingRequirements,
          teamData: null,
          playerCount: 0,
          videoCount: 0
        });
        setLoading(false);
        return;
      }

      // Check required team fields
      const requiredTeamFields = [
        'team_name', 'country', 'sport_type', 'member_association'
      ];
      
      const missingTeamFields = requiredTeamFields.filter(field => 
        !teamData[field] || teamData[field] === ''
      );

      if (missingTeamFields.length > 0) {
        missingRequirements.push(`Complete team profile: ${missingTeamFields.join(', ')}`);
      }

      if (!teamData.logo_url) {
        missingRequirements.push('Upload team logo');
      }

      if (!teamData.year_founded) {
        missingRequirements.push('Add year founded');
      }

      if (!teamData.league) {
        missingRequirements.push('Select league/competition');
      }

      if (!teamData.verified) {
        missingRequirements.push('Team profile must be verified');
      }

      // 2. Check player profiles completion
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamData.id);

      if (playersError) {
        console.error('Error fetching players:', playersError);
      }

      const playerCount = players?.length || 0;
      
      if (playerCount === 0) {
        missingRequirements.push('Add at least one player');
      }

      // Check if all players have complete profiles
      const incompletePlayersCount = (players || []).filter(player => {
        const requiredFields = [
          'full_name', 'position', 'citizenship', 'date_of_birth',
          'height', 'weight', 'bio', 'market_value'
        ];
        
        return requiredFields.some(field => 
          !player[field] || player[field] === '' || player[field] === null
        );
      }).length;

      if (incompletePlayersCount > 0) {
        missingRequirements.push(`Complete ${incompletePlayersCount} player profile(s)`);
      }

      // 3. Check video requirements
      const { data: videoReq } = await supabase
        .from('video_requirements')
        .select('video_count')
        .eq('team_id', teamData.id)
        .single();

      const videoCount = videoReq?.video_count || 0;
      
      if (videoCount < 5) {
        missingRequirements.push(`Upload ${5 - videoCount} more videos (minimum 5 required)`);
      }

      // Determine completion status
      const isTeamProfileComplete = missingTeamFields.length === 0 && 
                                   teamData.logo_url && 
                                   teamData.year_founded && 
                                   teamData.league &&
                                   teamData.verified;
      
      const hasMinimumPlayers = playerCount > 0 && incompletePlayersCount === 0;
      const hasMinimumVideos = videoCount >= 5;
      const canAccessFeatures = isTeamProfileComplete && hasMinimumPlayers && hasMinimumVideos;

      setCompletionStatus({
        isTeamProfileComplete,
        hasMinimumPlayers,
        hasMinimumVideos,
        canAccessFeatures,
        missingRequirements,
        teamData,
        playerCount,
        videoCount
      });

    } catch (error) {
      console.error('Error checking team completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCompletion = () => {
    checkTeamCompletion();
  };

  return {
    completionStatus,
    loading,
    refreshCompletion
  };
};
