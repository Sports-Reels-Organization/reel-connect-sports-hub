
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePlayer, DatabaseTeam, extractSingleResult } from '@/types/supabase-helpers';

interface Player extends DatabasePlayer {
  sport_type: string;
  nationality?: string;
  team?: string;
  height?: string;
  weight?: string;
  preferred_foot?: string;
  profile_image?: string;
  achievements?: string[];
  stats?: any;
}

export const usePlayerData = (playerId: string | null) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      return;
    }

    const fetchPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching player data for ID:', playerId);

        const { data, error: fetchError } = await supabase
          .from('players')
          .select(`
            id,
            full_name,
            position,
            age,
            height,
            weight,
            market_value,
            bio,
            citizenship,
            foot,
            photo_url,
            headshot_url,
            portrait_url,
            full_body_url,
            gender,
            date_of_birth,
            jersey_number,
            place_of_birth,
            player_agent,
            current_club,
            joined_date,
            contract_expires,
            fifa_id,
            leagues_participated,
            titles_seasons,
            transfer_history,
            international_duty,
            match_stats,
            ai_analysis,
            teams!inner(
              team_name,
              sport_type,
              country
            )
          `)
          .eq('id', playerId)
          .maybeSingle();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        if (data) {
          console.log('Player data received:', data);
          
          const teamData = extractSingleResult(data.teams as DatabaseTeam[]);
          
          const transformedPlayer: Player = {
            id: data.id,
            full_name: data.full_name,
            sport_type: teamData?.sport_type || 'Unknown',
            position: data.position,
            age: data.age,
            nationality: data.citizenship,
            team: teamData?.team_name,
            height: data.height?.toString(),
            weight: data.weight?.toString(),
            preferred_foot: data.foot,
            market_value: data.market_value,
            profile_image: data.headshot_url || data.photo_url || data.portrait_url,
            bio: data.bio,
            achievements: data.titles_seasons || [],
            stats: data.match_stats || {},
            // Copy all other fields
            citizenship: data.citizenship,
            headshot_url: data.headshot_url,
            photo_url: data.photo_url,
            portrait_url: data.portrait_url,
            full_body_url: data.full_body_url,
            jersey_number: data.jersey_number,
            gender: data.gender,
            date_of_birth: data.date_of_birth,
            place_of_birth: data.place_of_birth,
            foot: data.foot,
            player_agent: data.player_agent,
            current_club: data.current_club,
            joined_date: data.joined_date,
            contract_expires: data.contract_expires,
            fifa_id: data.fifa_id,
            leagues_participated: data.leagues_participated,
            titles_seasons: data.titles_seasons,
            transfer_history: data.transfer_history,
            international_duty: data.international_duty,
            match_stats: data.match_stats,
            ai_analysis: data.ai_analysis
          };

          setPlayer(transformedPlayer);
        } else {
          setError('Player not found');
        }
      } catch (err: any) {
        console.error('Error fetching player:', err);
        setError(err.message || 'Failed to fetch player data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [playerId]);

  return { player, loading, error };
};
