
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Video, User, DollarSign, Eye, Check } from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  position: string;
  market_value: number;
  citizenship: string;
  age: number;
  photo_url?: string;
  bio?: string;
  height?: number;
  weight?: number;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url?: string;
  duration?: number;
  tagged_players?: any[];
}

interface CreatePitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePitchModal: React.FC<CreatePitchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [transferType, setTransferType] = useState<'permanent' | 'loan'>('permanent');
  const [transferDetails, setTransferDetails] = useState({
    asking_price: '',
    sign_on_bonus: '',
    performance_bonus: '',
    player_salary: '',
    relocation_support: '',
    loan_fee: '',
    loan_with_option: false,
    loan_with_obligation: false,
    description: '',
    pitch_duration_days: 30
  });
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetchEligiblePlayers();
      fetchTeamVideos();
    }
  }, [isOpen]);

  const fetchEligiblePlayers = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamData.id)
        .not('full_name', 'is', null)
        .not('position', 'is', null)
        .not('citizenship', 'is', null)
        .not('date_of_birth', 'is', null)
        .not('height', 'is', null)
        .not('weight', 'is', null)
        .not('bio', 'is', null)
        .not('market_value', 'is', null);

      setPlayers(playersData || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchTeamVideos = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamData.id)
        .not('tagged_players', 'is', null);

      setVideos(videosData || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setCurrentStep(2);
  };

  const handleVideoToggle = (video: Video) => {
    if (selectedVideos.find(v => v.id === video.id)) {
      setSelectedVideos(selectedVideos.filter(v => v.id !== video.id));
    } else if (selectedVideos.length < 6) {
      setSelectedVideos([...selectedVideos, video]);
    } else {
      toast({
        title: "Video Limit Reached",
        description: "You can select up to 6 videos per pitch.",
        variant: "destructive"
      });
    }
  };

  const handleCreatePitch = async () => {
    if (!selectedPlayer || selectedVideos.length === 0) return;

    setLoading(true);
    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!teamData) throw new Error('Team not found');

      const pitchData = {
        team_id: teamData.id,
        player_id: selectedPlayer.id,
        transfer_type: transferType,
        asking_price: parseFloat(transferDetails.asking_price) || null,
        sign_on_bonus: parseFloat(transferDetails.sign_on_bonus) || null,
        performance_bonus: parseFloat(transferDetails.performance_bonus) || null,
        player_salary: parseFloat(transferDetails.player_salary) || null,
        relocation_support: parseFloat(transferDetails.relocation_support) || null,
        loan_fee: parseFloat(transferDetails.loan_fee) || null,
        loan_with_option: transferDetails.loan_with_option,
        loan_with_obligation: transferDetails.loan_with_obligation,
        description: transferDetails.description,
        tagged_videos: selectedVideos.map(v => v.id),
        pitch_duration_days: transferDetails.pitch_duration_days,
        expires_at: new Date(Date.now() + transferDetails.pitch_duration_days * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('transfer_pitches')
        .insert(pitchData);

      if (error) throw error;

      toast({
        title: "Pitch Created",
        description: `${selectedPlayer.full_name} has been pitched successfully.`
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating pitch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create pitch.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedPlayer(null);
    setSelectedVideos([]);
    setTransferDetails({
      asking_price: '',
      sign_on_bonus: '',
      performance_bonus: '',
      player_salary: '',
      relocation_support: '',
      loan_fee: '',
      loan_with_option: false,
      loan_with_obligation: false,
      description: '',
      pitch_duration_days: 30
    });
    onClose();
  };

  const canProceedToStep2 = selectedPlayer !== null;
  const canProceedToStep3 = selectedVideos.length > 0;
  const canCreatePitch = selectedPlayer && selectedVideos.length > 0 && 
    (transferType === 'permanent' ? transferDetails.asking_price : transferDetails.loan_fee);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Transfer Pitch</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={currentStep >= 1 ? "default" : "outline"} className={currentStep >= 1 ? "bg-rosegold text-black" : ""}>
              1. Select Player
            </Badge>
            <Badge variant={currentStep >= 2 ? "default" : "outline"} className={currentStep >= 2 ? "bg-rosegold text-black" : ""}>
              2. Attach Videos
            </Badge>
            <Badge variant={currentStep >= 3 ? "default" : "outline"} className={currentStep >= 3 ? "bg-rosegold text-black" : ""}>
              3. Transfer Details
            </Badge>
            <Badge variant={currentStep >= 4 ? "default" : "outline"} className={currentStep >= 4 ? "bg-rosegold text-black" : ""}>
              4. Preview
            </Badge>
          </div>
        </DialogHeader>

        {/* Step 1: Select Player */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Select a player with a complete profile to pitch. Only players with all required information can be pitched.
            </div>
            
            {players.length === 0 ? (
              <Card className="border-gray-700">
                <CardContent className="p-6 text-center">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                  <p className="text-gray-400">No eligible players found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete player profiles to pitch them
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {players.map((player) => (
                  <Card 
                    key={player.id} 
                    className="border-gray-700 hover:border-rosegold/50 cursor-pointer transition-colors"
                    onClick={() => handlePlayerSelect(player)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {player.photo_url ? (
                          <img 
                            src={player.photo_url} 
                            alt={player.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{player.full_name}</h4>
                          <p className="text-sm text-gray-400">{player.position} • {player.citizenship}</p>
                          <p className="text-sm text-rosegold">${(player.market_value || 0).toLocaleString()}</p>
                        </div>
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Attach Videos */}
        {currentStep === 2 && selectedPlayer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Selected Player: {selectedPlayer.full_name}</h3>
                <p className="text-sm text-gray-400">Select up to 6 tagged videos (minimum 1 required)</p>
              </div>
              <Badge className="bg-rosegold text-black">
                {selectedVideos.length}/6 videos selected
              </Badge>
            </div>
            
            {videos.length === 0 ? (
              <Card className="border-gray-700">
                <CardContent className="p-6 text-center">
                  <Video className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                  <p className="text-gray-400">No tagged videos found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload and tag videos to use them in pitches
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {videos.map((video) => {
                  const isSelected = selectedVideos.find(v => v.id === video.id);
                  return (
                    <Card 
                      key={video.id} 
                      className={`border-gray-700 cursor-pointer transition-colors ${
                        isSelected ? 'border-rosegold bg-rosegold/10' : 'hover:border-rosegold/50'
                      }`}
                      onClick={() => handleVideoToggle(video)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-video bg-gray-800 rounded-lg mb-2 relative overflow-hidden">
                          {video.thumbnail_url ? (
                            <img 
                              src={video.thumbnail_url} 
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-6 h-6 bg-rosegold rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-black" />
                              </div>
                            </div>
                          )}
                        </div>
                        <h4 className="text-white text-sm font-medium truncate">{video.title}</h4>
                        <p className="text-xs text-gray-400">
                          {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Duration unknown'}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                className="border-gray-600"
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                className="bg-rosegold text-black hover:bg-rosegold/90"
              >
                Next: Transfer Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Transfer Details */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Tabs value={transferType} onValueChange={(value) => setTransferType(value as 'permanent' | 'loan')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="permanent">Permanent Transfer</TabsTrigger>
                <TabsTrigger value="loan">Loan</TabsTrigger>
              </TabsList>

              <TabsContent value="permanent" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="asking_price" className="text-white">Asking Price (USD) *</Label>
                    <Input
                      id="asking_price"
                      type="number"
                      value={transferDetails.asking_price}
                      onChange={(e) => setTransferDetails({...transferDetails, asking_price: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="2000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sign_on_bonus" className="text-white">Sign-on Bonus (USD)</Label>
                    <Input
                      id="sign_on_bonus"
                      type="number"
                      value={transferDetails.sign_on_bonus}
                      onChange={(e) => setTransferDetails({...transferDetails, sign_on_bonus: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="performance_bonus" className="text-white">Performance Bonus (USD)</Label>
                    <Input
                      id="performance_bonus"
                      type="number"
                      value={transferDetails.performance_bonus}
                      onChange={(e) => setTransferDetails({...transferDetails, performance_bonus: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="player_salary" className="text-white">Player Salary (USD/year)</Label>
                    <Input
                      id="player_salary"
                      type="number"
                      value={transferDetails.player_salary}
                      onChange={(e) => setTransferDetails({...transferDetails, player_salary: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relocation_support" className="text-white">Relocation Support (USD)</Label>
                    <Input
                      id="relocation_support"
                      type="number"
                      value={transferDetails.relocation_support}
                      onChange={(e) => setTransferDetails({...transferDetails, relocation_support: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="25000"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="loan" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loan_fee" className="text-white">Loan Fee (USD) *</Label>
                    <Input
                      id="loan_fee"
                      type="number"
                      value={transferDetails.loan_fee}
                      onChange={(e) => setTransferDetails({...transferDetails, loan_fee: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="200000"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="loan_with_option"
                        checked={transferDetails.loan_with_option}
                        onCheckedChange={(checked) => setTransferDetails({...transferDetails, loan_with_option: !!checked})}
                      />
                      <Label htmlFor="loan_with_option" className="text-white">Loan with option to buy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="loan_with_obligation"
                        checked={transferDetails.loan_with_obligation}
                        onCheckedChange={(checked) => setTransferDetails({...transferDetails, loan_with_obligation: !!checked})}
                      />
                      <Label htmlFor="loan_with_obligation" className="text-white">Loan with obligation to buy</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="description" className="text-white">Additional Details</Label>
              <Textarea
                id="description"
                value={transferDetails.description}
                onChange={(e) => setTransferDetails({...transferDetails, description: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Any additional information about the transfer..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="pitch_duration" className="text-white">Pitch Duration</Label>
              <Select 
                value={transferDetails.pitch_duration_days.toString()} 
                onValueChange={(value) => setTransferDetails({...transferDetails, pitch_duration_days: parseInt(value)})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
                className="border-gray-600"
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(4)}
                disabled={!canCreatePitch}
                className="bg-rosegold text-black hover:bg-rosegold/90"
              >
                Preview Pitch
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {currentStep === 4 && selectedPlayer && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Pitch Preview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-rosegold font-medium mb-2">Player Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-400">Name:</span> <span className="text-white">{selectedPlayer.full_name}</span></p>
                    <p><span className="text-gray-400">Position:</span> <span className="text-white">{selectedPlayer.position}</span></p>
                    <p><span className="text-gray-400">Age:</span> <span className="text-white">{selectedPlayer.age}</span></p>
                    <p><span className="text-gray-400">Market Value:</span> <span className="text-white">${selectedPlayer.market_value?.toLocaleString()}</span></p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-rosegold font-medium mb-2">Transfer Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-400">Type:</span> <span className="text-white">{transferType === 'permanent' ? 'Permanent Transfer' : 'Loan'}</span></p>
                    {transferType === 'permanent' ? (
                      <>
                        <p><span className="text-gray-400">Asking Price:</span> <span className="text-white">${parseFloat(transferDetails.asking_price || '0').toLocaleString()}</span></p>
                        {transferDetails.sign_on_bonus && <p><span className="text-gray-400">Sign-on Bonus:</span> <span className="text-white">${parseFloat(transferDetails.sign_on_bonus).toLocaleString()}</span></p>}
                      </>
                    ) : (
                      <>
                        <p><span className="text-gray-400">Loan Fee:</span> <span className="text-white">${parseFloat(transferDetails.loan_fee || '0').toLocaleString()}</span></p>
                        {transferDetails.loan_with_option && <p className="text-green-400">✓ Option to buy</p>}
                        {transferDetails.loan_with_obligation && <p className="text-green-400">✓ Obligation to buy</p>}
                      </>
                    )}
                    <p><span className="text-gray-400">Duration:</span> <span className="text-white">{transferDetails.pitch_duration_days} days</span></p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-rosegold font-medium mb-2">Attached Videos ({selectedVideos.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVideos.map((video) => (
                    <Badge key={video.id} variant="outline" className="border-rosegold text-rosegold">
                      {video.title}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {transferDetails.description && (
                <div className="mt-4">
                  <h4 className="text-rosegold font-medium mb-2">Additional Details</h4>
                  <p className="text-gray-300 text-sm">{transferDetails.description}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(3)}
                className="border-gray-600"
              >
                Back
              </Button>
              <Button 
                onClick={handleCreatePitch}
                disabled={loading}
                className="bg-rosegold text-black hover:bg-rosegold/90"
              >
                {loading ? 'Creating Pitch...' : 'Publish Pitch'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePitchModal;
