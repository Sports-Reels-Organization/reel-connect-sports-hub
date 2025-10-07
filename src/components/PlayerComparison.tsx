
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, X, Plus } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;

interface PlayerComparisonProps {
  players: DatabasePlayer[];
  isOpen: boolean;
  onClose: () => void;
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({
  players,
  isOpen,
  onClose
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<DatabasePlayer[]>([]);

  const addPlayerToComparison = (playerId: string) => {
    if (selectedPlayers.length >= 3) return;

    const player = players.find(p => p.id === playerId);
    if (player && !selectedPlayers.find(p => p.id === playerId)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const removePlayerFromComparison = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getComparisonData = () => [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Position', key: 'position' },
    { label: 'Age', key: 'age' },
    { label: 'Height (cm)', key: 'height' },
    { label: 'Weight (kg)', key: 'weight' },
    { label: 'Nationality', key: 'citizenship' },
    { label: 'Jersey Number', key: 'jersey_number' },
    { label: 'Market Value', key: 'market_value', format: (value: any) => value ? `$${value.toLocaleString()}` : '-' },
    { label: 'Contract Expires', key: 'contract_expires', format: (value: any) => value ? new Date(value).toLocaleDateString() : '-' },
    { label: 'Current Club', key: 'current_club' },
    { label: 'Preferred Foot', key: 'foot' },
    { label: 'Place of Birth', key: 'place_of_birth' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-polysans flex items-center gap-2">
              <Users className="h-5 w-5" />
              Player Comparison
            </CardTitle>
            <Button variant="ghost" onClick={onClose} className="text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Player Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-3">
                {selectedPlayers[index] ? (
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedPlayers[index].headshot_url || selectedPlayers[index].photo_url || ''} />
                          <AvatarFallback className="bg-rosegold text-white">
                            {selectedPlayers[index].full_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-semibold text-sm">{selectedPlayers[index].full_name}</h3>
                          <p className="text-gray-400 text-xs">{selectedPlayers[index].position}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayerFromComparison(selectedPlayers[index].id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 border-dashed">
                    <Select onValueChange={addPlayerToComparison}>
                      <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                        <SelectValue placeholder={`Select Player ${index + 1}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {players
                          .filter(player => !selectedPlayers.find(sp => sp.id === player.id))
                          .map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              <div className="flex items-center gap-2">
                                <span>{player.full_name}</span>
                                {player.jersey_number && (
                                  <Badge className="bg-bright-pink text-white text-xs px-1.5 py-0.5 font-bold">
                                    #{player.jersey_number}
                                  </Badge>
                                )}
                                <span className="text-gray-400">- {player.position}</span>
                              </div>
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          {selectedPlayers.length >= 2 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-white font-semibold p-3 border-b border-gray-700">
                      Attribute
                    </th>
                    {selectedPlayers.map((player, index) => (
                      <th key={index} className="text-center text-white font-semibold p-3 border-b border-gray-700">
                        {player.full_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getComparisonData().map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                      <td className="text-white font-medium p-3 border-b border-gray-700">
                        {row.label}
                      </td>
                      {selectedPlayers.map((player, playerIndex) => {
                        const value = player[row.key as keyof DatabasePlayer];
                        const displayValue = row.format ? row.format(value) : formatValue(value);

                        return (
                          <td key={playerIndex} className="text-center text-gray-300 p-3 border-b border-gray-700">
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedPlayers.length < 2 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">
                Select at least 2 players to compare
              </div>
              <div className="text-gray-500 text-sm">
                You can compare up to 3 players side by side
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerComparison;
