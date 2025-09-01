
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, Users, Upload } from 'lucide-react';
import { TeamData, PlayerData } from '@/types/database';

interface TransferPitchForm {
  player_id: string;
  transfer_type: 'permanent' | 'loan';
  asking_price: string;
  currency: string;
  expires_at: string;
  description: string;
}

const CreateTransferPitch: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [formData, setFormData] = useState<TransferPitchForm>({
    player_id: '',
    transfer_type: 'permanent',
    asking_price: '',
    currency: 'USD',
    expires_at: '',
    description: ''
  });

  useEffect(() => {
    if (profile?.user_type === 'team') {
      fetchTeamData();
    }
  }, [profile]);

  const fetchTeamData = async () => {
    if (!profile?.id) return;

    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (teamError) {
        console.error('Error fetching team:', teamError);
        return;
      }

      if (team) {
        setTeamData(team as TeamData);
        fetchPlayers(team.id);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const fetchPlayers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('full_name');

      if (error) throw error;

      setPlayers(data as PlayerData[]);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team players",
        variant: "destructive"
      });
    }
  };

  const checkRequirements = async () => {
    if (!teamData?.id || !formData.player_id) return false;

    try {
      // Check video count
      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamData.id);

      if ((videoCount || 0) < 5) {
        toast({
          title: "Insufficient Videos",
          description: "You need at least 5 videos to create a transfer pitch",
          variant: "destructive"
        });
        return false;
      }

      // Check player profile completeness
      const player = players.find(p => p.id === formData.player_id);
      if (!player) return false;

      const requiredFields = ['full_name', 'position', 'citizenship', 'date_of_birth', 'height', 'weight', 'bio', 'market_value'];
      const missingFields = requiredFields.filter(field => !player[field as keyof PlayerData]);

      if (missingFields.length > 0) {
        toast({
          title: "Incomplete Player Profile",
          description: `Please complete the player profile. Missing: ${missingFields.join(', ')}`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking requirements:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamData?.id || !profile?.id) {
      toast({
        title: "Error",
        description: "Team data not found",
        variant: "destructive"
      });
      return;
    }

    const requirementsMet = await checkRequirements();
    if (!requirementsMet) return;

    setLoading(true);
    try {
      const expiresAt = new Date(formData.expires_at);
      if (expiresAt <= new Date()) {
        toast({
          title: "Invalid Date",
          description: "Expiry date must be in the future",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('transfer_pitches')
        .insert({
          team_id: teamData.id,
          player_id: formData.player_id,
          transfer_type: formData.transfer_type,
          asking_price: formData.asking_price ? parseFloat(formData.asking_price) : null,
          currency: formData.currency,
          expires_at: expiresAt.toISOString(),
          description: formData.description,
          status: 'active',
          deal_stage: 'pitch_created',
          created_by: profile.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transfer pitch created successfully",
      });

      // Reset form
      setFormData({
        player_id: '',
        transfer_type: 'permanent',
        asking_price: '',
        currency: 'USD',
        expires_at: '',
        description: ''
      });

    } catch (error) {
      console.error('Error creating transfer pitch:', error);
      toast({
        title: "Error",
        description: "Failed to create transfer pitch",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.user_type !== 'team') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-gray-400">
            Only team accounts can create transfer pitches.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!teamData) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-polysans text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-rosegold" />
            Create Transfer Pitch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Selection */}
            <div className="space-y-2">
              <Label className="text-white">Select Player *</Label>
              <Select
                value={formData.player_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, player_id: value }))}
                required
              >
                <SelectTrigger className="bg-background border-border text-white">
                  <SelectValue placeholder="Choose a player" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id} className="text-white">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{player.full_name} - {player.position}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {players.length === 0 && (
                <p className="text-sm text-orange-400">
                  No players found. Please add players to your team first.
                </p>
              )}
            </div>

            {/* Transfer Type */}
            <div className="space-y-2">
              <Label className="text-white">Transfer Type *</Label>
              <Select
                value={formData.transfer_type}
                onValueChange={(value: 'permanent' | 'loan') => setFormData(prev => ({ ...prev, transfer_type: value }))}
              >
                <SelectTrigger className="bg-background border-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="permanent" className="text-white">Permanent Transfer</SelectItem>
                  <SelectItem value="loan" className="text-white">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asking Price */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="asking_price" className="text-white">Asking Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="asking_price"
                    type="number"
                    value={formData.asking_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, asking_price: e.target.value }))}
                    className="bg-background border-border text-white pl-10"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="USD" className="text-white">USD</SelectItem>
                    <SelectItem value="EUR" className="text-white">EUR</SelectItem>
                    <SelectItem value="GBP" className="text-white">GBP</SelectItem>
                    <SelectItem value="NGN" className="text-white">NGN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expires_at" className="text-white">Pitch Expires *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="bg-background border-border text-white pl-10"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <p className="text-sm text-gray-400">
                Set when this pitch will automatically expire
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Additional Information</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border text-white resize-none"
                placeholder="Any additional details about the transfer..."
                rows={4}
              />
            </div>

            {/* Requirements Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">Requirements</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Your team must have at least 5 uploaded videos</li>
                <li>• Selected player's profile must be complete</li>
                <li>• All required player information must be filled</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.player_id || !formData.expires_at}
              className="w-full bg-rosegold hover:bg-rosegold/90 text-white"
            >
              {loading ? 'Creating Pitch...' : 'Create Transfer Pitch'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTransferPitch;
