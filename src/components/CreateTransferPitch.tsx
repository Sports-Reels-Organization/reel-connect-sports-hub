
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Calendar, FileText, Video, User } from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  position: string;
  photo_url?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url?: string;
}

const CreateTransferPitch: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [transferType, setTransferType] = useState<'permanent' | 'loan'>('permanent');
  const [askingPrice, setAskingPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlayersAndVideos();
  }, []);

  const fetchPlayersAndVideos = async () => {
    try {
      // Get team info
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (teamData) {
        // Fetch players
        const { data: playersData } = await supabase
          .from('players')
          .select('id, full_name, position, photo_url')
          .eq('team_id', teamData.id);

        // Fetch videos
        const { data: videosData } = await supabase
          .from('videos')
          .select('id, title, thumbnail_url')
          .eq('team_id', teamData.id);

        setPlayers(playersData || []);
        setVideos(videosData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleVideoToggle = (videoId: string) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : prev.length < 6
          ? [...prev, videoId]
          : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer) {
      toast({
        title: "Error",
        description: "Please select a player to pitch",
        variant: "destructive"
      });
      return;
    }

    if (selectedVideos.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one video",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get team info
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!teamData) {
        throw new Error('Team not found');
      }

      // Create transfer pitch
      const { data: pitchData, error } = await supabase
        .from('transfer_pitches')
        .insert({
          team_id: teamData.id,
          player_id: selectedPlayer,
          transfer_type: transferType,
          asking_price: askingPrice ? parseFloat(askingPrice) : null,
          currency,
          description
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Player pitched successfully to the timeline!",
      });

      // Reset form
      setSelectedPlayer('');
      setSelectedVideos([]);
      setAskingPrice('');
      setDescription('');
    } catch (error) {
      console.error('Error creating pitch:', error);
      toast({
        title: "Error",
        description: "Failed to create pitch",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.user_type !== 'team') {
    return (
      <Card className=" border-rosegold/20">
        <CardContent className="p-12 text-center">
          <User className="h-12 w-12 text-rosegold mx-auto mb-4" />
          <h3 className="text-xl font-polysans text-white mb-2">Teams Only</h3>
          <p className="text-gray-400 font-poppins">
            Only team accounts can create transfer pitches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className=" border-rosegold/20">
      <CardHeader>
        <CardTitle className="font-polysans text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-rosegold" />
          Create Transfer Pitch
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Selection */}
          <div className="space-y-2">
            <Label className="text-white">Select Player</Label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                <SelectValue placeholder="Choose a player to pitch" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.full_name} - {player.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Selection */}
          <div className="space-y-2">
            <Label className="text-white">Select Videos (up to 6)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`relative cursor-pointer rounded-lg border-2 transition-colors ${selectedVideos.includes(video.id)
                    ? 'border-rosegold bg-rosegold/20'
                    : 'border-gray-600 hover:border-rosegold/50'
                    }`}
                  onClick={() => handleVideoToggle(video.id)}
                >
                  <div className="aspect-video rounded-lg flex items-center justify-center">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Video className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-white p-2 truncate">{video.title}</p>
                  {selectedVideos.includes(video.id) && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-rosegold text-white">Selected</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {videos.length === 0 && (
              <p className="text-gray-400 text-sm">No videos uploaded yet. Please upload videos first.</p>
            )}
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Transfer Type</Label>
              <Select value={transferType} onValueChange={(value: 'permanent' | 'loan') => setTransferType(value)}>
                <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent Transfer</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Asking Price (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Enter asking price"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="bg-white/10 border-rosegold/30 text-white pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <Textarea
              placeholder="Describe the player's strengths, achievements, and why they'd be a great addition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/10 border-rosegold/30 text-white min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !selectedPlayer || selectedVideos.length === 0}
            className="w-full bg-rosegold hover:bg-rosegold/90 font-polysans"
          >
            {loading ? 'Creating Pitch...' : 'Pitch Player to Timeline'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTransferPitch;
