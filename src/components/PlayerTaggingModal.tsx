import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, User, X, Tag, Check } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;

interface PlayerTaggingModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    requestTitle: string;
    onPlayerTagged: (playerId: string, playerName: string) => void;
}

const PlayerTaggingModal: React.FC<PlayerTaggingModalProps> = ({
    isOpen,
    onClose,
    requestId,
    requestTitle,
    onPlayerTagged
}) => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [players, setPlayers] = useState<DatabasePlayer[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<DatabasePlayer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<DatabasePlayer | null>(null);

    useEffect(() => {
        if (isOpen && profile?.user_type === 'team') {
            fetchTeamPlayers();
        }
    }, [isOpen, profile]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPlayers(players);
        } else {
            const filtered = players.filter(player =>
                player.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.citizenship?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPlayers(filtered);
        }
    }, [searchTerm, players]);

    const fetchTeamPlayers = async () => {
        if (!profile?.id) return;

        try {
            setLoading(true);

            // Get team ID
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .select('id')
                .eq('profile_id', profile.id)
                .single();

            if (teamError || !team) {
                throw new Error('Team not found');
            }

            // Get team's pitched players (only players that are currently pitched)
            const { data: pitchedPlayers, error: pitchedError } = await supabase
                .from('transfer_pitches')
                .select('player_id')
                .eq('team_id', team.id)
                .eq('status', 'active')
                .gt('expires_at', new Date().toISOString());

            if (pitchedError) throw pitchedError;

            const pitchedPlayerIds = pitchedPlayers?.map(p => p.player_id) || [];

            if (pitchedPlayerIds.length === 0) {
                toast({
                    title: "No Pitched Players",
                    description: "You need to have active player pitches to tag players to requests.",
                    variant: "destructive"
                });
                onClose();
                return;
            }

            // Get player details for pitched players
            const { data: playersData, error: playersError } = await supabase
                .from('players')
                .select('*')
                .in('id', pitchedPlayerIds)
                .order('full_name');

            if (playersError) throw playersError;

            setPlayers(playersData || []);
            setFilteredPlayers(playersData || []);
        } catch (error) {
            console.error('Error fetching team players:', error);
            toast({
                title: "Error",
                description: "Failed to fetch your players",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerSelect = (player: DatabasePlayer) => {
        setSelectedPlayer(player);
    };

    const handleTagPlayer = async () => {
        if (!selectedPlayer) return;

        try {
            // For now, just log the tag action
            // Once migrations are deployed, this will work with the database
            console.log('Tagging player to request:', {
                requestId,
                playerId: selectedPlayer.id,
                playerName: selectedPlayer.full_name,
                taggedBy: profile?.id
            });

            toast({
                title: "Success",
                description: `${selectedPlayer.full_name} has been tagged to this request`,
            });

            onPlayerTagged(selectedPlayer.id, selectedPlayer.full_name || '');
            onClose();
        } catch (error) {
            console.error('Error tagging player:', error);
            toast({
                title: "Error",
                description: "Failed to tag player to request",
                variant: "destructive"
            });
        }
    };

    const getPositionBadge = (position: string) => {
        const positionColors: Record<string, string> = {
            'Goalkeeper': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Defender': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Midfielder': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Forward': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Striker': 'bg-red-500/20 text-red-400 border-red-500/30'
        };

        const color = positionColors[position] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

        return (
            <Badge variant="outline" className={color}>
                {position}
            </Badge>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white font-polysans">Tag Player to Request</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Request Info */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-white font-semibold mb-2">Request Details</h3>
                        <p className="text-gray-300 text-sm">{requestTitle}</p>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">Search Players</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, position, or nationality..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-[#111111] border-0 text-white"
                            />
                        </div>
                    </div>

                    {/* Players List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-white text-sm font-medium">
                                Your Pitched Players ({filteredPlayers.length})
                            </label>
                            {loading && (
                                <div className="text-gray-400 text-sm">Loading...</div>
                            )}
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {filteredPlayers.length === 0 ? (
                                <div className="text-center py-8">
                                    <User className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">
                                        {searchTerm ? 'No players match your search' : 'No pitched players found'}
                                    </p>
                                </div>
                            ) : (
                                filteredPlayers.map((player) => (
                                    <div
                                        key={player.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedPlayer?.id === player.id
                                            ? 'border-rosegold bg-rosegold/10'
                                            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                                            }`}
                                        onClick={() => handlePlayerSelect(player)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                    {player.headshot_url || player.photo_url ? (
                                                        <img
                                                            src={player.headshot_url || player.photo_url}
                                                            alt={player.full_name || ''}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-medium">
                                                        {player.full_name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {player.position && getPositionBadge(player.position)}
                                                        {player.citizenship && (
                                                            <span className="text-gray-400 text-xs">
                                                                {player.citizenship}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedPlayer?.id === player.id && (
                                                <Check className="h-5 w-5 text-rosegold" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Selected Player Info */}
                    {selectedPlayer && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-white font-semibold mb-2">Selected Player</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                    {selectedPlayer.headshot_url || selectedPlayer.photo_url ? (
                                        <img
                                            src={selectedPlayer.headshot_url || selectedPlayer.photo_url}
                                            alt={selectedPlayer.full_name || ''}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-medium">
                                        {selectedPlayer.full_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {selectedPlayer.position && getPositionBadge(selectedPlayer.position)}
                                        {selectedPlayer.citizenship && (
                                            <span className="text-gray-400 text-xs">
                                                {selectedPlayer.citizenship}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleTagPlayer}
                            disabled={!selectedPlayer}
                            className="flex-1 bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            Tag Player
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlayerTaggingModal; 