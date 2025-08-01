
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  id: string;
  full_name: string;
  sport_type: string;
  position?: string;
  age?: number;
  nationality?: string;
  team?: string;
  height?: string;
  weight?: string;
  preferred_foot?: string;
  market_value?: number;
  profile_image?: string;
  achievements?: string[];
  bio?: string;
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
            teams!inner(
              team_name,
              sport_type,
              country
            )
          `)
          .eq('id', playerId)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          const transformedPlayer: Player = {
            id: data.id,
            full_name: data.full_name,
            sport_type: data.teams.sport_type,
            position: data.position,
            age: data.age,
            nationality: data.citizenship,
            team: data.teams.team_name,
            height: data.height?.toString(),
            weight: data.weight?.toString(),
            preferred_foot: data.foot,
            market_value: data.market_value,
            profile_image: data.photo_url,
            bio: data.bio,
            achievements: [],
            stats: {}
          };

          setPlayer(transformedPlayer);
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
