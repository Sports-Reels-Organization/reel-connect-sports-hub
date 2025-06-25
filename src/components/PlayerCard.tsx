
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, User } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;

interface PlayerCardProps {
  player: DatabasePlayer;
  onEdit: (player: DatabasePlayer) => void;
  onView: (player: DatabasePlayer) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onEdit, onView }) => {
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-rosegold/50 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {player.headshot_url || player.photo_url ? (
                <img
                  src={player.headshot_url || player.photo_url || ''}
                  alt={player.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-polysans font-semibold text-white mb-1 truncate">
                {player.full_name}
              </h3>
              <p className="text-sm text-gray-400 font-poppins">{player.position}</p>
              {player.jersey_number && (
                <Badge variant="outline" className="text-rosegold border-rosegold mt-1">
                  #{player.jersey_number}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Age:</span>
            <span className="text-white">
              {player.date_of_birth ? calculateAge(player.date_of_birth) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Nationality:</span>
            <span className="text-white">{player.citizenship}</span>
          </div>
          {player.height && (
            <div className="flex justify-between">
              <span className="text-gray-400">Height:</span>
              <span className="text-white">{player.height}cm</span>
            </div>
          )}
          {player.foot && (
            <div className="flex justify-between">
              <span className="text-gray-400">Foot:</span>
              <span className="text-white capitalize">{player.foot}</span>
            </div>
          )}
          {player.market_value && (
            <div className="flex justify-between">
              <span className="text-gray-400">Value:</span>
              <span className="text-bright-pink font-semibold">
                ${player.market_value.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onView(player)}
            size="sm"
            className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
          <Button
            onClick={() => onEdit(player)}
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
