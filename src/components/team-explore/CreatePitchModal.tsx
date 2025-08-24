
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  User, 
  Play, 
  DollarSign, 
  FileText, 
  Eye, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Upload
} from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  position: string;
  age: number;
  citizenship: string;
  market_value: number;
  photo_url?: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  tagged_players: any[];
}

interface CreatePitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePitchModal: React.FC<CreatePitchModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  // Form data
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [transferType, setTransferType] = useState<'permanent' | 'loan'>('permanent');
  const [transferData, setTransferData] = useState({
    asking_price: '',
    sign_on_bonus: '',
    performance_bonus: '',
    player_salary: '',
    relocation_support: '',
    loan_fee: '',
    loan_with_option: false,
    loan_with_obligation: false,
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
      fetchVideos();
    }
  }, [isOpen, profile]);

  const fetchPlayers = async () => {
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

  const fetchVideos = async () => {
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
        .eq('team_id', teamData.id);

      // Transform the data to match our interface
      const transformedVideos = (videosData || []).map(video => ({
        ...video,
        tagged_players: Array.isArray(video.tagged_players) 
          ? video.tagged_players 
          : typeof video.tagged_players === 'string' 
            ? JSON.parse(video.tagged_players) 
            : []
      }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleVideoToggle = (videoId: string) => {
    setSelectedVideos(prev => {
      if (prev.includes(videoId)) {
        return prev.filter(id => id !== videoId);
      } else if (prev.length < 6) {
        return [...prev, videoId];
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!selectedPlayer) return;

    try {
      setLoading(true);

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
        asking_price: transferData.asking_price ? parseFloat(transferData.asking_price) : null,
        sign_on_bonus: transferData.sign_on_bonus ? parseFloat(transferData.sign_on_bonus) : null,
        performance_bonus: transferData.performance_bonus ? parseFloat(transferData.performance_bonus) : null,
        player_salary: transferData.player_salary ? parseFloat(transferData.player_salary) : null,
        relocation_support: transferData.relocation_support ? parseFloat(transferData.relocation_support) : null,
        loan_fee: transferData.loan_fee ? parseFloat(transferData.loan_fee) : null,
        loan_with_option: transferData.loan_with_option,
        loan_with_obligation: transferData.loan_with_obligation,
        description: transferData.description,
        tagged_videos: selectedVideos,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('transfer_pitches')
        .insert(pitchData);

      if (error) throw error;

      toast({
        title: "Pitch Created Successfully",
        description: `${selectedPlayer.full_name} has been added to the transfer timeline.`
      });

      onSuccess();
      onClose();
      resetForm();
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

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedPlayer(null);
    setSelectedVideos([]);
    setTransferType('permanent');
    setTransferData({
      asking_price: '',
      sign_on_bonus: '',
      performance_bonus: '',
      player_salary: '',
      relocation_support: '',
      loan_fee: '',
      loan_with_option: false,
      loan_with_obligation: false,
      description: ''
    });
  };

  const getPlayerVideos = (playerId: string) => {
    return videos.filter(video => 
      video.tagged_players?.includes(playerId)
    );
  };

  const canProceedToStep2 = selectedPlayer !== null;
  const canProceedToStep3 = selectedVideos.length > 0;
  const canSubmit = transferType === 'permanent' 
    ? transferData.asking_price && transferData.player_salary
    : transferData.loan_fee;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Create Transfer Pitch - Step {currentStep} of 4
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-rosegold text-black' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-rosegold' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Select Player */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                <h3 className="text-lg font-medium">Select Player to Pitch</h3>
              </div>
              
              {players.length === 0 ? (
                <Card className="border-gray-700">
                  <CardContent className="p-6 text-center">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <h4 className="text-white mb-2">No Eligible Players</h4>
                    <p className="text-gray-400 text-sm">
                      All players must have complete profiles (name, position, citizenship, DOB, height, weight, bio, market value) to be pitched.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {players.map((player) => {
                    const playerVideos = getPlayerVideos(player.id);
                    const isSelected = selectedPlayer?.id === player.id;
                    
                    return (
                      <Card 
                        key={player.id} 
                        className={`border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-rosegold bg-rosegold/10' 
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={player.photo_url} alt={player.full_name} />
                              <AvatarFallback className="bg-gray-700 text-white">
                                {player.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-white font-medium">{player.full_name}</h4>
                              <p className="text-gray-400 text-sm">
                                {player.position} • Age {player.age} • {player.citizenship}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-sm">
                                <span className="text-green-400">
                                  ${player.market_value?.toLocaleString()}
                                </span>
                                <span className="text-blue-400">
                                  {playerVideos.length} videos
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Attach Videos */}
          {currentStep === 2 && selectedPlayer && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Play className="w-5 h-5" />
                <h3 className="text-lg font-medium">Attach Videos ({selectedVideos.length}/6)</h3>
              </div>
              
              {(() => {
                const playerVideos = getPlayerVideos(selectedPlayer.id);
                
                if (playerVideos.length === 0) {
                  return (
                    <Card className="border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <h4 className="text-white mb-2">No Tagged Videos</h4>
                        <p className="text-gray-400 text-sm">
                          This player has no tagged videos. Upload and tag videos before creating a pitch.
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {playerVideos.map((video) => {
                      const isSelected = selectedVideos.includes(video.id);
                      
                      return (
                        <Card 
                          key={video.id}
                          className={`border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-rosegold bg-rosegold/10' 
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                          onClick={() => handleVideoToggle(video.id)}
                        >
                          <CardContent className="p-3">
                            <div className="relative mb-2">
                              {video.thumbnail_url && (
                                <img 
                                  src={video.thumbnail_url} 
                                  alt={video.title}
                                  className="w-full h-24 object-cover rounded"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h4 className="text-white text-sm font-medium truncate">
                              {video.title}
                            </h4>
                            <p className="text-gray-400 text-xs">
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 3: Transfer Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5" />
                <h3 className="text-lg font-medium">Transfer Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Button
                  variant={transferType === 'permanent' ? 'default' : 'outline'}
                  onClick={() => setTransferType('permanent')}
                  className={transferType === 'permanent' ? 'bg-rosegold text-black' : 'border-gray-600 text-gray-300'}
                >
                  Permanent Transfer
                </Button>
                <Button
                  variant={transferType === 'loan' ? 'default' : 'outline'}
                  onClick={() => setTransferType('loan')}
                  className={transferType === 'loan' ? 'bg-rosegold text-black' : 'border-gray-600 text-gray-300'}
                >
                  Loan Transfer
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {transferType === 'permanent' ? (
                  <>
                    <div>
                      <Label className="text-white">Asking Price * (USD)</Label>
                      <Input
                        type="number"
                        value={transferData.asking_price}
                        onChange={(e) => setTransferData(prev => ({ ...prev, asking_price: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="e.g., 500000"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Player Salary * (USD/year)</Label>
                      <Input
                        type="number"
                        value={transferData.player_salary}
                        onChange={(e) => setTransferData(prev => ({ ...prev, player_salary: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="e.g., 120000"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Sign-on Bonus (USD)</Label>
                      <Input
                        type="number"
                        value={transferData.sign_on_bonus}
                        onChange={(e) => setTransferData(prev => ({ ...prev, sign_on_bonus: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Performance Bonus (USD)</Label>
                      <Input
                        type="number"
                        value={transferData.performance_bonus}
                        onChange={(e) => setTransferData(prev => ({ ...prev, performance_bonus: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="e.g., 25000"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Relocation Support (USD)</Label>
                      <Input
                        type="number"
                        value={transferData.relocation_support}
                        onChange={(e) => setTransferData(prev => ({ ...prev, relocation_support: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="e.g., 10000"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-white">Loan Fee * (USD)</Label>
                      <Input
                        type="number"
                        value={transferData.loan_fee}
                        onChange={(e) => setTransferData(prev => ({ ...prev, loan_fee: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="e.g., 100000"
                      />
                    </div>
                    <div className="flex items-center space-x-4 pt-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="loan_option"
                          checked={transferData.loan_with_option}
                          onCheckedChange={(checked) => 
                            setTransferData(prev => ({ ...prev, loan_with_option: checked as boolean }))
                          }
                        />
                        <Label htmlFor="loan_option" className="text-white text-sm">
                          Option to buy
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="loan_obligation"
                          checked={transferData.loan_with_obligation}
                          onCheckedChange={(checked) => 
                            setTransferData(prev => ({ ...prev, loan_with_obligation: checked as boolean }))
                          }
                        />
                        <Label htmlFor="loan_obligation" className="text-white text-sm">
                          Obligation to buy
                        </Label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label className="text-white">Additional Information</Label>
                <Textarea
                  value={transferData.description}
                  onChange={(e) => setTransferData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Any additional details about the transfer..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && selectedPlayer && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5" />
                <h3 className="text-lg font-medium">Preview Pitch</h3>
              </div>

              <Card className="border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Transfer Pitch Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Player Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedPlayer.photo_url} alt={selectedPlayer.full_name} />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {selectedPlayer.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-white font-medium text-lg">{selectedPlayer.full_name}</h4>
                      <p className="text-gray-400">
                        {selectedPlayer.position} • Age {selectedPlayer.age} • {selectedPlayer.citizenship}
                      </p>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 mt-1">
                        Market Value: ${selectedPlayer.market_value?.toLocaleString()}
                      </Badge>
                    </div>
                  </div>

                  {/* Transfer Details */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-2">Transfer Terms</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white ml-2 capitalize">{transferType}</span>
                      </div>
                      {transferType === 'permanent' ? (
                        <>
                          <div>
                            <span className="text-gray-400">Asking Price:</span>
                            <span className="text-white ml-2">
                              ${parseFloat(transferData.asking_price || '0').toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Annual Salary:</span>
                            <span className="text-white ml-2">
                              ${parseFloat(transferData.player_salary || '0').toLocaleString()}
                            </span>
                          </div>
                          {transferData.sign_on_bonus && (
                            <div>
                              <span className="text-gray-400">Sign-on Bonus:</span>
                              <span className="text-white ml-2">
                                ${parseFloat(transferData.sign_on_bonus).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-gray-400">Loan Fee:</span>
                            <span className="text-white ml-2">
                              ${parseFloat(transferData.loan_fee || '0').toLocaleString()}
                            </span>
                          </div>
                          {transferData.loan_with_option && (
                            <div className="col-span-2">
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                Option to Buy
                              </Badge>
                            </div>
                          )}
                          {transferData.loan_with_obligation && (
                            <div className="col-span-2">
                              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                                Obligation to Buy
                              </Badge>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Videos */}
                  <div>
                    <h5 className="text-white font-medium mb-2">
                      Attached Videos ({selectedVideos.length})
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedVideos.slice(0, 3).map((videoId) => {
                        const video = videos.find(v => v.id === videoId);
                        return video ? (
                          <div key={video.id} className="text-center">
                            <div className="bg-gray-700 rounded p-2 mb-1">
                              <Play className="w-6 h-6 mx-auto text-white" />
                            </div>
                            <p className="text-xs text-gray-400 truncate">{video.title}</p>
                          </div>
                        ) : null;
                      })}
                      {selectedVideos.length > 3 && (
                        <div className="text-center">
                          <div className="bg-gray-700 rounded p-2 mb-1">
                            <span className="text-white text-sm">+{selectedVideos.length - 3}</span>
                          </div>
                          <p className="text-xs text-gray-400">more videos</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {transferData.description && (
                    <div>
                      <h5 className="text-white font-medium mb-2">Additional Information</h5>
                      <p className="text-gray-300 text-sm bg-gray-800 rounded p-3">
                        {transferData.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : () => setCurrentStep(prev => prev - 1)}
            className="border-gray-600 text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={
                (currentStep === 1 && !canProceedToStep2) ||
                (currentStep === 2 && !canProceedToStep3) ||
                (currentStep === 3 && !canSubmit)
              }
              className="bg-rosegold text-black hover:bg-rosegold/90 disabled:opacity-50"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-rosegold text-black hover:bg-rosegold/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Pitch'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePitchModal;
