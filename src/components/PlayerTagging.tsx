
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, X } from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  position: string;
  team_name: string;
}

interface PlayerTaggingProps {
  selectedPlayers: string[];
  onPlayersChange: (playerIds: string[]) => void;
}

export const PlayerTagging: React.FC<PlayerTaggingProps> = ({
  selectedPlayers,
  onPlayersChange
}) => {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<Player[]>([]);

  useEffect(() => {
    fetchAvailablePlayers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = availablePlayers.filter(player =>
        player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers([]);
    }
  }, [searchTerm, availablePlayers]);

  useEffect(() => {
    if (selectedPlayers.length > 0) {
      const details = availablePlayers.filter(player => 
        selectedPlayers.includes(player.id)
      );
      setSelectedPlayerDetails(details);
    } else {
      setSelectedPlayerDetails([]);
    }
  }, [selectedPlayers, availablePlayers]);

  const fetchAvailablePlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          player_id,
          players!inner(
            id,
            full_name,
            position
          ),
          teams!inner(
            team_name
          )
        `)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;

      const players = (data || []).map(pitch => ({
        id: pitch.player_id,
        full_name: pitch.players?.full_name || '',
        position: pitch.players?.position || '',
        team_name: pitch.teams?.team_name || ''
      }));

      // Remove duplicates
      const uniquePlayers = players.filter((player, index, self) =>
        index === self.findIndex(p => p.id === player.id)
      );

      setAvailablePlayers(uniquePlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleSelectPlayer = (player: Player) => {
    if (!selectedPlayers.includes(player.id)) {
      onPlayersChange([...selectedPlayers, player.id]);
    }
    setSearchTerm('');
  };

  const handleRemovePlayer = (playerId: string) => {
    onPlayersChange(selectedPlayers.filter(id => id !== playerId));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search players to tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-700 border-gray-600 text-white"
        />
        
        {searchTerm && filteredPlayers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md max-h-60 overflow-y-auto">
            {filteredPlayers.slice(0, 10).map((player) => (
              <button
                key={player.id}
                onClick={() => handleSelectPlayer(player)}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                disabled={selectedPlayers.includes(player.id)}
              >
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white font-medium">{player.full_name}</p>
                  <p className="text-gray-400 text-sm">{player.position} • {player.team_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPlayerDetails.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Tagged Players ({selectedPlayerDetails.length}):</p>
          <div className="flex flex-wrap gap-2">
            {selectedPlayerDetails.map((player) => (
              <Badge
                key={player.id}
                variant="secondary"
                className="flex items-center gap-1 bg-rosegold/20 text-rosegold border-rosegold"
              >
                <User className="w-3 h-3" />
                {player.full_name}
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="ml-1 hover:bg-rosegold/30 rounded"
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
