
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, User, Tag } from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  position: string;
  team_name: string;
  asking_price: number;
  currency: string;
}

interface PlayerTaggingProps {
  selectedPlayers: string[];
  onPlayersChange: (players: string[]) => void;
}

export const PlayerTagging: React.FC<PlayerTaggingProps> = ({
  selectedPlayers,
  onPlayersChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search for players
  useEffect(() => {
    const searchPlayers = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('transfer_pitches')
          .select(`
            player_id,
            asking_price,
            currency,
            players!inner(
              full_name,
              position
            ),
            teams!inner(
              team_name
            )
          `)
          .eq('status', 'active')
          .ilike('players.full_name', `%${searchTerm}%`)
          .limit(5);

        if (error) throw error;

        const players: Player[] = (data || []).map((pitch: any) => ({
          id: pitch.player_id,
          full_name: pitch.players?.full_name || '',
          position: pitch.players?.position || '',
          team_name: pitch.teams?.team_name || '',
          asking_price: pitch.asking_price || 0,
          currency: pitch.currency || 'USD'
        }));

        setSearchResults(players);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching players:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPlayers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch details for selected players
  useEffect(() => {
    const fetchSelectedPlayerDetails = async () => {
      if (selectedPlayers.length === 0) {
        setSelectedPlayerDetails([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transfer_pitches')
          .select(`
            player_id,
            asking_price,
            currency,
            players!inner(
              full_name,
              position
            ),
            teams!inner(
              team_name
            )
          `)
          .in('player_id', selectedPlayers)
          .eq('status', 'active');

        if (error) throw error;

        const players: Player[] = (data || []).map((pitch: any) => ({
          id: pitch.player_id,
          full_name: pitch.players?.full_name || '',
          position: pitch.players?.position || '',
          team_name: pitch.teams?.team_name || '',
          asking_price: pitch.asking_price || 0,
          currency: pitch.currency || 'USD'
        }));

        setSelectedPlayerDetails(players);
      } catch (error) {
        console.error('Error fetching selected players:', error);
      }
    };

    fetchSelectedPlayerDetails();
  }, [selectedPlayers]);

  const handleSelectPlayer = (player: Player) => {
    if (!selectedPlayers.includes(player.id)) {
      onPlayersChange([...selectedPlayers, player.id]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemovePlayer = (playerId: string) => {
    onPlayersChange(selectedPlayers.filter(id => id !== playerId));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-rosegold" />
          <span className="text-sm font-medium text-gray-300">Tag Players</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search for players to tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white"
            onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
          />
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border-gray-700 max-h-60 overflow-y-auto">
            <CardContent className="p-2">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  <Search className="w-5 h-5 mx-auto mb-2 animate-spin" />
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No players found
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((player) => (
                    <Button
                      key={player.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto hover:bg-gray-700"
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-white">{player.full_name}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {player.position} • {player.team_name}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {player.asking_price.toLocaleString()} {player.currency}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Players */}
      {selectedPlayerDetails.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-300">Tagged Players:</span>
          <div className="flex flex-wrap gap-2">
            {selectedPlayerDetails.map((player) => (
              <Badge
                key={player.id}
                variant="secondary"
                className="bg-rosegold/20 text-rosegold border-rosegold/30 px-3 py-1 flex items-center gap-2"
              >
                <span className="text-sm">{player.full_name}</span>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="hover:bg-rosegold/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
