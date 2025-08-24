import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Grid, List, MoreHorizontal, Edit, Eye, Tag } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { PlayerTagManager } from './PlayerTagManager';
import { TagBadge } from './TagBadge';
import { usePlayerTags } from '@/hooks/usePlayerTags';

type DatabasePlayer = Tables<'players'>;

interface PlayerRosterViewProps {
  players: DatabasePlayer[];
  onEditPlayer: (player: DatabasePlayer) => void;
  onViewPlayer: (player: DatabasePlayer) => void;
}

const PlayerRosterView: React.FC<PlayerRosterViewProps> = ({
  players,
  onEditPlayer,
  onViewPlayer
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<keyof DatabasePlayer>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedPlayerForTags, setSelectedPlayerForTags] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const {
    availableTags,
    loading,
    createTag,
    getPlayerTags,
    addTagToPlayer,
    removeTagFromPlayer
  } = usePlayerTags();

  const getPlayerTags_Original = (player: DatabasePlayer) => {
    const tags: { label: string; color: string }[] = [];
    
    // Contract status tags
    if (player.contract_expires) {
      const expiryDate = new Date(player.contract_expires);
      const now = new Date();
      const monthsUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsUntilExpiry < 0) {
        tags.push({ label: 'Contract Expired', color: 'bg-red-500' });
      } else if (monthsUntilExpiry < 6) {
        tags.push({ label: 'Expiring Soon', color: 'bg-yellow-500' });
      }
    }

    // Age-based tags
    if (player.age) {
      if (player.age < 21) {
        tags.push({ label: 'Youth Prospect', color: 'bg-blue-500' });
      } else if (player.age > 30) {
        tags.push({ label: 'Experienced', color: 'bg-purple-500' });
      }
    }

    // Market value tags
    if (player.market_value) {
      if (player.market_value > 1000000) {
        tags.push({ label: 'High Value', color: 'bg-green-500' });
      }
    }

    return tags;
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: keyof DatabasePlayer) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewPlayer = (player: DatabasePlayer) => {
    navigate(`/players/${player.id}`);
  };

  if (viewMode === 'table') {
    return (
      <Card className="border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-polysans">Team Roster</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-white border-gray-600"
              >
                <Grid className="h-4 w-4 mr-1" />
                Grid View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('table')}
                className="bg-rosegold text-white"
              >
                <List className="h-4 w-4 mr-1" />
                Table View
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="text-white cursor-pointer hover:text-rosegold"
                  onClick={() => handleSort('full_name')}
                >
                  Player {sortBy === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-white cursor-pointer hover:text-rosegold"
                  onClick={() => handleSort('position')}
                >
                  Position {sortBy === 'position' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-white cursor-pointer hover:text-rosegold"
                  onClick={() => handleSort('age')}
                >
                  Age {sortBy === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-white cursor-pointer hover:text-rosegold"
                  onClick={() => handleSort('citizenship')}
                >
                  Nationality {sortBy === 'citizenship' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-white cursor-pointer hover:text-rosegold"
                  onClick={() => handleSort('contract_expires')}
                >
                  Contract Expiry {sortBy === 'contract_expires' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="text-white cursor-pointer hover:text-rosegold"
                  onClick={() => handleSort('market_value')}
                >
                  Market Value {sortBy === 'market_value' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-white">Tags</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => {
                const systemTags = getPlayerTags_Original(player);
                const customTags = getPlayerTags(player.id);
                return (
                  <TableRow key={player.id} className="hover:bg-gray-800">
                    <TableCell className="text-white">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.headshot_url || player.photo_url || ''} />
                          <AvatarFallback className="bg-rosegold text-white text-xs">
                            {player.full_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{player.full_name}</div>
                          {player.jersey_number && (
                            <div className="text-xs text-gray-400">#{player.jersey_number}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{player.position}</TableCell>
                    <TableCell className="text-white">{player.age || '-'}</TableCell>
                    <TableCell className="text-white">{player.citizenship}</TableCell>
                    <TableCell className="text-white">
                      {player.contract_expires 
                        ? new Date(player.contract_expires).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-white">
                      {player.market_value 
                        ? `$${player.market_value.toLocaleString()}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Custom Tags */}
                        {customTags.map((tag) => (
                          <TagBadge key={tag.id} tag={tag} />
                        ))}
                        {/* System Tags */}
                        {systemTags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} className={`${tag.color} text-white text-xs`}>
                            {tag.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleViewPlayer(player)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditPlayer(player)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Player
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedPlayerForTags(player.id)}>
                            <Tag className="h-4 w-4 mr-2" />
                            Manage Tags
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>

        {/* Tag Management Dialog */}
        <Dialog open={!!selectedPlayerForTags} onOpenChange={() => setSelectedPlayerForTags(null)}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Manage Tags - {players.find(p => p.id === selectedPlayerForTags)?.full_name}
              </DialogTitle>
            </DialogHeader>
            {selectedPlayerForTags && (
              <PlayerTagManager
                playerId={selectedPlayerForTags}
                playerTags={getPlayerTags(selectedPlayerForTags)}
                availableTags={availableTags}
                onAddTag={addTagToPlayer}
                onRemoveTag={removeTagFromPlayer}
                onCreateTag={createTag}
                loading={loading}
              />
            )}
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card className="border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-polysans">Team Roster</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
              className="bg-rosegold text-white"
            >
              <Grid className="h-4 w-4 mr-1" />
              Grid View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('table')}
              className="text-white border-gray-600"
            >
              <List className="h-4 w-4 mr-1" />
              Table View
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPlayers.map((player) => {
            const systemTags = getPlayerTags_Original(player);
            const customTags = getPlayerTags(player.id);
            return (
              <Card key={player.id} className="bg-gray-800 border-gray-700 hover:border-rosegold transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={player.headshot_url || player.photo_url || ''} />
                      <AvatarFallback className="bg-rosegold text-white">
                        {player.full_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">{player.full_name}</h3>
                      <p className="text-gray-400 text-xs">{player.position}</p>
                      {player.jersey_number && (
                        <p className="text-rosegold text-xs">#{player.jersey_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Age:</span>
                      <span>{player.age || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nationality:</span>
                      <span>{player.citizenship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Value:</span>
                      <span>{player.market_value ? `$${player.market_value.toLocaleString()}` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contract:</span>
                      <span>
                        {player.contract_expires 
                          ? new Date(player.contract_expires).getFullYear()
                          : '-'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Player Tags */}
                  {(customTags.length > 0 || systemTags.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {/* Custom Tags First */}
                      {customTags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} />
                      ))}
                      {/* System Tags */}
                      {systemTags.map((tag, index) => (
                        <Badge key={index} className={`${tag.color} text-white text-xs`}>
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPlayer(player)}
                      className="flex-1 text-white border-gray-600 hover:bg-rosegold"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPlayer(player)}
                      className="text-white border-gray-600 hover:bg-rosegold"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPlayerForTags(player.id)}
                      className="text-white border-gray-600 hover:bg-bright-pink"
                    >
                      <Tag className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tag Management Dialog */}
        <Dialog open={!!selectedPlayerForTags} onOpenChange={() => setSelectedPlayerForTags(null)}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Manage Tags - {players.find(p => p.id === selectedPlayerForTags)?.full_name}
              </DialogTitle>
            </DialogHeader>
            {selectedPlayerForTags && (
              <PlayerTagManager
                playerId={selectedPlayerForTags}
                playerTags={getPlayerTags(selectedPlayerForTags)}
                availableTags={availableTags}
                onAddTag={addTagToPlayer}
                onRemoveTag={removeTagFromPlayer}
                onCreateTag={createTag}
                loading={loading}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PlayerRosterView;
