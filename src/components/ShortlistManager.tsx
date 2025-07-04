
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, HeartOff, MessageCircle, Eye, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ShortlistItem {
  id: string;
  notes: string;
  created_at: string;
  pitch: {
    id: string;
    expires_at: string;
    asking_price: number;
    currency: string;
    transfer_type: string;
    player: {
      id: string;
      full_name: string;
      position: string;
      age: number;
      photo_url: string;
      market_value: number;
      citizenship: string;
    };
    team: {
      team_name: string;
      country: string;
    };
  };
}

interface ShortlistManagerProps {
  pitchId?: string;
  playerId?: string;
  onShortlistChange?: (isShortlisted: boolean) => void;
  showFullList?: boolean;
}

export const ShortlistManager: React.FC<ShortlistManagerProps> = ({
  pitchId,
  playerId,
  onShortlistChange,
  showFullList = false
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [shortlistItems, setShortlistItems] = useState<ShortlistItem[]>([]);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'agent') {
      fetchAgentId();
    }
  }, [profile]);

  useEffect(() => {
    if (agentId) {
      if (showFullList) {
        fetchShortlist();
      } else if (pitchId && playerId) {
        checkShortlistStatus();
      }
    }
  }, [agentId, pitchId, playerId, showFullList]);

  const fetchAgentId = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) throw error;
      setAgentId(data.id);
    } catch (error) {
      console.error('Error fetching agent ID:', error);
    }
  };

  const fetchShortlist = async () => {
    if (!agentId) return;

    try {
      const { data, error } = await supabase
        .from('shortlist')
        .select(`
          id,
          notes,
          created_at,
          pitch:transfer_pitches(
            id,
            expires_at,
            asking_price,
            currency,
            transfer_type,
            player:players(
              id,
              full_name,
              position,
              age,
              photo_url,
              market_value,
              citizenship
            ),
            team:teams(
              team_name,
              country
            )
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShortlistItems(data || []);
    } catch (error) {
      console.error('Error fetching shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to load shortlist",
        variant: "destructive"
      });
    }
  };

  const checkShortlistStatus = async () => {
    if (!agentId || !pitchId || !playerId) return;

    try {
      const { data, error } = await supabase
        .from('shortlist')
        .select('id, notes')
        .eq('agent_id', agentId)
        .eq('pitch_id', pitchId)
        .eq('player_id', playerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setIsShortlisted(!!data);
      setNotes(data?.notes || '');
    } catch (error) {
      console.error('Error checking shortlist status:', error);
    }
  };

  const toggleShortlist = async () => {
    if (!agentId || !pitchId || !playerId) return;

    setLoading(true);
    try {
      if (isShortlisted) {
        // Remove from shortlist
        const { error } = await supabase
          .from('shortlist')
          .delete()
          .eq('agent_id', agentId)
          .eq('pitch_id', pitchId)
          .eq('player_id', playerId);

        if (error) throw error;

        setIsShortlisted(false);
        setNotes('');
        toast({
          title: "Removed from Shortlist",
          description: "Player removed from your shortlist",
        });
      } else {
        // Add to shortlist
        const { error } = await supabase
          .from('shortlist')
          .insert({
            agent_id: agentId,
            pitch_id: pitchId,
            player_id: playerId,
            notes: notes
          });

        if (error) throw error;

        setIsShortlisted(true);
        toast({
          title: "Added to Shortlist",
          description: "Player added to your shortlist",
        });
      }

      if (onShortlistChange) {
        onShortlistChange(!isShortlisted);
      }
    } catch (error) {
      console.error('Error toggling shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to update shortlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNotes = async () => {
    if (!agentId || !pitchId || !playerId || !isShortlisted) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shortlist')
        .update({ notes })
        .eq('agent_id', agentId)
        .eq('pitch_id', pitchId)
        .eq('player_id', playerId);

      if (error) throw error;

      toast({
        title: "Notes Updated",
        description: "Shortlist notes updated successfully",
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromShortlist = async (shortlistId: string) => {
    try {
      const { error } = await supabase
        .from('shortlist')
        .delete()
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.filter(item => item.id !== shortlistId));
      toast({
        title: "Removed",
        description: "Player removed from shortlist",
      });
    } catch (error) {
      console.error('Error removing from shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from shortlist",
        variant: "destructive"
      });
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  if (profile?.user_type !== 'agent') {
    return null;
  }

  // Show full shortlist
  if (showFullList) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-6">My Shortlist</h2>
        {shortlistItems.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Your shortlist is empty</p>
              <p className="text-sm text-gray-400 mt-1">Start shortlisting players from the timeline</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {shortlistItems.map((item) => (
              <Card key={item.id} className={`${isExpired(item.pitch.expires_at) ? 'opacity-60 border-red-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {item.pitch.player.photo_url && (
                        <img
                          src={item.pitch.player.photo_url}
                          alt={item.pitch.player.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{item.pitch.player.full_name}</h3>
                        <p className="text-gray-400">{item.pitch.player.position} • Age {item.pitch.player.age}</p>
                        <p className="text-sm text-gray-500">{item.pitch.team.team_name} • {item.pitch.team.country}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{item.pitch.transfer_type}</Badge>
                          <Badge variant="outline">
                            {item.pitch.asking_price?.toLocaleString()} {item.pitch.currency}
                          </Badge>
                          {isExpired(item.pitch.expires_at) ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(item.pitch.expires_at))} left
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromShortlist(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-300">{item.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show shortlist toggle for individual player
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleShortlist}
          disabled={loading}
          variant={isShortlisted ? "default" : "outline"}
          size="sm"
          className={isShortlisted ? "bg-rosegold hover:bg-rosegold/90" : ""}
        >
          {isShortlisted ? (
            <>
              <Heart className="w-4 h-4 mr-2 fill-current" />
              Shortlisted
            </>
          ) : (
            <>
              <HeartOff className="w-4 h-4 mr-2" />
              Add to Shortlist
            </>
          )}
        </Button>
      </div>

      {isShortlisted && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add notes about this player..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-gray-800 border-gray-600"
            rows={3}
          />
          <Button
            onClick={updateNotes}
            disabled={loading}
            size="sm"
            variant="secondary"
          >
            Update Notes
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShortlistManager;
