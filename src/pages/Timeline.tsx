
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, MapPin, MessageSquare, User, Clock, Target } from 'lucide-react';
import MessagePlayerModal from '@/components/MessagePlayerModal';

interface TransferPitch {
  id: string;
  description: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  status: string;
  created_at: string;
  expires_at: string;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    headshot_url: string;
    photo_url: string;
    jersey_number: number;
    age?: number;
  };
  teams: {
    team_name: string;
    country: string;
    logo_url: string;
  };
}

const Timeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    fetchTransferPitches();
  }, []);

  const fetchTransferPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            headshot_url,
            photo_url,
            jersey_number,
            date_of_birth
          ),
          teams!inner(
            team_name,
            country,
            logo_url
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate age for each player
      const processedData = (data || []).map(pitch => ({
        ...pitch,
        players: {
          ...pitch.players,
          age: pitch.players.date_of_birth 
            ? new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear()
            : undefined
        }
      }));

      setPitches(processedData);
    } catch (error) {
      console.error('Error fetching transfer pitches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
  };

  const handleSendMessage = (player: any) => {
    setSelectedPlayer(player);
    setShowMessageModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6 bg-gray-900 min-h-screen p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white mb-2">
              Transfer Timeline
            </h1>
            <p className="text-gray-400 font-poppins">
              Discover the latest player transfer opportunities
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pitches.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                No Active Transfer Pitches
              </h3>
              <p className="text-gray-400 font-poppins">
                There are currently no active player transfer opportunities available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pitches.map((pitch) => (
              <Card key={pitch.id} className="bg-gray-800 border-gray-700 hover:border-rosegold/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Player Header */}
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 cursor-pointer"
                        onClick={() => handlePlayerClick(pitch.players)}
                      >
                        {pitch.players.headshot_url || pitch.players.photo_url ? (
                          <img
                            src={pitch.players.headshot_url || pitch.players.photo_url}
                            alt={pitch.players.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 
                          className="font-polysans font-bold text-white text-lg cursor-pointer hover:text-rosegold"
                          onClick={() => handlePlayerClick(pitch.players)}
                        >
                          {pitch.players.full_name}
                        </h3>
                        <p className="text-gray-300 font-poppins text-sm">
                          {pitch.players.position}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {pitch.players.jersey_number && (
                            <Badge variant="outline" className="text-rosegold border-rosegold">
                              #{pitch.players.jersey_number}
                            </Badge>
                          )}
                          <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                            {pitch.transfer_type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{pitch.teams.team_name}, {pitch.teams.country}</span>
                    </div>

                    {/* Player Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nationality:</span>
                        <span className="text-white">{pitch.players.citizenship}</span>
                      </div>
                      {pitch.players.age && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Age:</span>
                          <span className="text-white">{pitch.players.age} years</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {pitch.description && (
                      <p className="text-gray-300 font-poppins text-sm line-clamp-3">
                        {pitch.description}
                      </p>
                    )}

                    {/* Price */}
                    {pitch.asking_price && (
                      <div className="flex items-center gap-2 text-lg font-bold text-bright-pink">
                        <DollarSign className="h-5 w-5" />
                        {formatCurrency(pitch.asking_price, pitch.currency)}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(pitch.created_at)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={pitch.status === 'active' ? 'text-green-400 border-green-400' : 'text-gray-400 border-gray-400'}
                      >
                        {pitch.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Action Button */}
                    {profile?.user_type === 'agent' && (
                      <Button
                        onClick={() => handleSendMessage(pitch.players)}
                        size="sm"
                        className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Express Interest
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showMessageModal && selectedPlayer && (
          <MessagePlayerModal
            player={selectedPlayer}
            isOpen={showMessageModal}
            onClose={() => {
              setShowMessageModal(false);
              setSelectedPlayer(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Timeline;
