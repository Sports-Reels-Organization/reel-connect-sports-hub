
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Video, DollarSign, Calendar, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;
type DatabaseVideo = Tables<'videos'>;

interface CreateTransferPitchProps {
  isOpen: boolean;
  onClose: () => void;
  onPitchCreated: () => void;
}

const CreateTransferPitch: React.FC<CreateTransferPitchProps> = ({ isOpen, onClose, onPitchCreated }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState<string>('');
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [videoRequirements, setVideoRequirements] = useState<{ video_count: number } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<DatabasePlayer | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    transfer_type: 'permanent' as 'permanent' | 'loan',
    asking_price: '',
    currency: 'USD',
    sign_on_bonus: '',
    performance_bonus: '',
    player_salary: '',
    relocation_support: '',
    loan_fee: '',
    loan_with_option: false,
    loan_with_obligation: false,
    is_international: false,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      fetchTeamData();
    }
  }, [isOpen, profile]);

  const fetchTeamData = async () => {
    if (!profile?.id) return;

    try {
      // Get team ID and info
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, member_association')
        .eq('profile_id', profile.id)
        .single();

      if (teamError || !team) {
        toast({
          title: "Error",
          description: "Could not find your team profile",
          variant: "destructive"
        });
        return;
      }

      setTeamId(team.id);

      // Check video requirements
      const { data: videoReq, error: videoReqError } = await supabase
        .from('video_requirements')
        .select('video_count')
        .eq('team_id', team.id)
        .single();

      setVideoRequirements(videoReq);

      // Get eligible players (complete profiles only)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', team.id)
        .not('full_name', 'is', null)
        .not('position', 'is', null)
        .not('citizenship', 'is', null)
        .not('date_of_birth', 'is', null)
        .not('height', 'is', null)
        .not('weight', 'is', null)
        .not('bio', 'is', null)
        .not('market_value', 'is', null);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        return;
      }

      setPlayers(playersData || []);

      // Get team videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', team.id)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        return;
      }

      setVideos(videosData || []);

    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const validateRequirements = () => {
    if (!videoRequirements || videoRequirements.video_count < 5) {
      toast({
        title: "Insufficient Videos",
        description: "Your team needs at least 5 videos to create transfer pitches",
        variant: "destructive"
      });
      return false;
    }

    if (!selectedPlayer) {
      toast({
        title: "No Player Selected",
        description: "Please select a player to pitch",
        variant: "destructive"
      });
      return false;
    }

    if (selectedVideos.length === 0) {
      toast({
        title: "No Videos Selected",
        description: "Please select at least one video to include in the pitch",
        variant: "destructive"
      });
      return false;
    }

    if (selectedVideos.length > 6) {
      toast({
        title: "Too Many Videos",
        description: "You can select a maximum of 6 videos per pitch",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRequirements()) return;

    setLoading(true);
    try {
      // Validate using database function
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_transfer_pitch_requirements', {
          p_team_id: teamId,
          p_player_id: selectedPlayer!.id
        });

      if (validationError) {
        console.error('Validation error:', validationError);
        toast({
          title: "Validation Error",
          description: "Could not validate requirements",
          variant: "destructive"
        });
        return;
      }

      if (!isValid) {
        toast({
          title: "Requirements Not Met",
          description: "Player profile is incomplete or team doesn't have enough videos",
          variant: "destructive"
        });
        return;
      }

      const pitchData = {
        team_id: teamId,
        player_id: selectedPlayer!.id,
        description: formData.description,
        transfer_type: formData.transfer_type,
        asking_price: formData.asking_price ? parseFloat(formData.asking_price) : null,
        currency: formData.currency,
        sign_on_bonus: formData.sign_on_bonus ? parseFloat(formData.sign_on_bonus) : null,
        performance_bonus: formData.performance_bonus ? parseFloat(formData.performance_bonus) : null,
        player_salary: formData.player_salary ? parseFloat(formData.player_salary) : null,
        relocation_support: formData.relocation_support ? parseFloat(formData.relocation_support) : null,
        loan_fee: formData.loan_fee ? parseFloat(formData.loan_fee) : null,
        loan_with_option: formData.loan_with_option,
        loan_with_obligation: formData.loan_with_obligation,
        is_international: formData.is_international,
        tagged_videos: selectedVideos,
        expires_at: formData.expires_at,
        status: 'active' as const,
        service_charge_rate: 15.0,
        tier_level: 'basic'
      };

      const { error } = await supabase
        .from('transfer_pitches')
        .insert(pitchData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transfer pitch created successfully!",
      });

      onPitchCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating pitch:', error);
      toast({
        title: "Error",
        description: `Failed to create pitch: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : prev.length < 6 
          ? [...prev, videoId]
          : prev
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white font-polysans">Create Transfer Pitch</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Requirements Check */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <h3 className="font-polysans text-white">Requirements Check</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${videoRequirements && videoRequirements.video_count >= 5 ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${videoRequirements && videoRequirements.video_count >= 5 ? 'bg-green-400' : 'bg-red-400'}`} />
                Team Videos: {videoRequirements?.video_count || 0}/5 required
              </div>
              <div className={`flex items-center gap-2 ${players.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${players.length > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                Complete Player Profiles: {players.length}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Selection */}
            <div className="space-y-2">
              <Label className="text-white">Select Player *</Label>
              <Select value={selectedPlayer?.id || ''} onValueChange={(value) => {
                const player = players.find(p => p.id === value);
                setSelectedPlayer(player || null);
              }}>
                <SelectTrigger className="bg-[#111111] border-0 text-white">
                  <SelectValue placeholder="Choose player to pitch" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-0">
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id} className="text-white">
                      {player.full_name} - {player.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Video Selection */}
            <div className="space-y-2">
              <Label className="text-white">Select Videos (Max 6) *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {videos.map((video) => (
                  <div key={video.id} className="flex items-center space-x-2 p-2 border border-gray-600 rounded">
                    <Checkbox
                      id={`video-${video.id}`}
                      checked={selectedVideos.includes(video.id)}
                      onCheckedChange={() => toggleVideoSelection(video.id)}
                      disabled={selectedVideos.length >= 6 && !selectedVideos.includes(video.id)}
                    />
                    <label htmlFor={`video-${video.id}`} className="text-sm text-white cursor-pointer flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      {video.title}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">Selected: {selectedVideos.length}/6</p>
            </div>

            {/* Transfer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Transfer Type *</Label>
                <Select value={formData.transfer_type} onValueChange={(value: 'permanent' | 'loan') => 
                  setFormData({...formData, transfer_type: value})
                }>
                  <SelectTrigger className="bg-[#111111] border-0 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-0">
                    <SelectItem value="permanent" className="text-white">Permanent Transfer</SelectItem>
                    <SelectItem value="loan" className="text-white">Loan Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => 
                  setFormData({...formData, currency: value})
                }>
                  <SelectTrigger className="bg-[#111111] border-0 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-0">
                    <SelectItem value="USD" className="text-white">USD ($)</SelectItem>
                    <SelectItem value="EUR" className="text-white">EUR (€)</SelectItem>
                    <SelectItem value="GBP" className="text-white">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  {formData.transfer_type === 'permanent' ? 'Transfer Fee' : 'Loan Fee'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.transfer_type === 'permanent' ? formData.asking_price : formData.loan_fee}
                  onChange={(e) => setFormData({
                    ...formData, 
                    [formData.transfer_type === 'permanent' ? 'asking_price' : 'loan_fee']: e.target.value
                  })}
                  className="bg-[#111111] border-0 text-white"
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Expires On</Label>
                <Input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  className="bg-[#111111] border-0 text-white"
                />
              </div>
            </div>

            {/* Permanent Transfer Fields */}
            {formData.transfer_type === 'permanent' && (
              <div className="space-y-4">
                <h3 className="text-white font-polysans">Contract Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Sign-on Bonus</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sign_on_bonus}
                      onChange={(e) => setFormData({...formData, sign_on_bonus: e.target.value})}
                      className="bg-[#111111] border-0 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Performance Bonus</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.performance_bonus}
                      onChange={(e) => setFormData({...formData, performance_bonus: e.target.value})}
                      className="bg-[#111111] border-0 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Player Salary</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.player_salary}
                      onChange={(e) => setFormData({...formData, player_salary: e.target.value})}
                      className="bg-[#111111] border-0 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Relocation Support</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.relocation_support}
                      onChange={(e) => setFormData({...formData, relocation_support: e.target.value})}
                      className="bg-[#111111] border-0 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Loan Transfer Fields */}
            {formData.transfer_type === 'loan' && (
              <div className="space-y-4">
                <h3 className="text-white font-polysans">Loan Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loan_with_option"
                      checked={formData.loan_with_option}
                      onCheckedChange={(checked) => setFormData({...formData, loan_with_option: checked as boolean})}
                    />
                    <label htmlFor="loan_with_option" className="text-white">
                      Loan with Option to Buy
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loan_with_obligation"
                      checked={formData.loan_with_obligation}
                      onCheckedChange={(checked) => setFormData({...formData, loan_with_obligation: checked as boolean})}
                    />
                    <label htmlFor="loan_with_obligation" className="text-white">
                      Loan with Obligation to Buy
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* International Transfer */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_international"
                checked={formData.is_international}
                onCheckedChange={(checked) => setFormData({...formData, is_international: checked as boolean})}
              />
              <label htmlFor="is_international" className="text-white">
                International Transfer (Premium tier required)
              </label>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-white">Pitch Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-[#111111] border-0 text-white resize-none"
                placeholder="Describe the player and what makes them a great transfer opportunity..."
                rows={4}
              />
            </div>

            {/* Service Charge Notice */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">
                  A 15% service charge applies to all successful transfers
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !selectedPlayer || selectedVideos.length === 0}
                className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
              >
                {loading ? 'Creating Pitch...' : 'Create Transfer Pitch'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTransferPitch;
