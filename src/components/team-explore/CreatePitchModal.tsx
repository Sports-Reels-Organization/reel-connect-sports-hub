
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Video, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  position: string;
  age: number;
  market_value: number;
  photo_url?: string;
  citizenship: string;
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
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [transferDetails, setTransferDetails] = useState({
    transferType: 'permanent' as 'permanent' | 'loan',
    askingPrice: 0,
    signOnBonus: 0,
    performanceBonus: 0,
    playerSalary: 0,
    relocationSupport: 0,
    loanFee: 0,
    loanWithOption: false,
    loanWithObligation: false,
    description: '',
    currency: 'USD'
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

      // Only fetch players with complete profiles
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

      // Transform the data to handle tagged_players JSON field
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

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!selectedPlayer) {
          toast({
            title: "Player Required",
            description: "Please select a player for this pitch.",
            variant: "destructive"
          });
          return false;
        }
        break;
      case 2:
        if (selectedVideos.length === 0) {
          toast({
            title: "Videos Required",
            description: "Please select at least one video for this pitch.",
            variant: "destructive"
          });
          return false;
        }
        if (selectedVideos.length > 6) {
          toast({
            title: "Too Many Videos",
            description: "Please select no more than 6 videos.",
            variant: "destructive"
          });
          return false;
        }
        break;
      case 3:
        if (transferDetails.transferType === 'permanent' && transferDetails.askingPrice <= 0) {
          toast({
            title: "Asking Price Required",
            description: "Please enter a valid asking price for permanent transfers.",
            variant: "destructive"
          });
          return false;
        }
        if (transferDetails.transferType === 'loan' && transferDetails.loanFee <= 0) {
          toast({
            title: "Loan Fee Required",
            description: "Please enter a valid loan fee for loan transfers.",
            variant: "destructive"
          });
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedPlayer || !profile?.id) return;

    try {
      setLoading(true);

      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) {
        throw new Error('Team not found');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const pitchData = {
        team_id: teamData.id,
        player_id: selectedPlayer.id,
        transfer_type: transferDetails.transferType,
        asking_price: transferDetails.transferType === 'permanent' ? transferDetails.askingPrice : null,
        sign_on_bonus: transferDetails.signOnBonus,
        performance_bonus: transferDetails.performanceBonus,
        player_salary: transferDetails.playerSalary,
        relocation_support: transferDetails.relocationSupport,
        loan_fee: transferDetails.transferType === 'loan' ? transferDetails.loanFee : null,
        loan_with_option: transferDetails.loanWithOption,
        loan_with_obligation: transferDetails.loanWithObligation,
        tagged_videos: selectedVideos,
        description: transferDetails.description,
        currency: transferDetails.currency,
        status: 'active' as const,
        expires_at: expiresAt.toISOString()
      };

      const { error } = await supabase
        .from('transfer_pitches')
        .insert(pitchData);

      if (error) throw error;

      toast({
        title: "Pitch Created",
        description: `Transfer pitch for ${selectedPlayer.full_name} has been created successfully.`
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
    setStep(1);
    setSelectedPlayer(null);
    setSelectedVideos([]);
    setTransferDetails({
      transferType: 'permanent',
      askingPrice: 0,
      signOnBonus: 0,
      performanceBonus: 0,
      playerSalary: 0,
      relocationSupport: 0,
      loanFee: 0,
      loanWithOption: false,
      loanWithObligation: false,
      description: '',
      currency: 'USD'
    });
  };

  const getPlayerVideos = () => {
    if (!selectedPlayer) return [];
    return videos.filter(video => 
      video.tagged_players && 
      video.tagged_players.some((tag: any) => tag.playerId === selectedPlayer.id)
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Select Player</h3>
              <p className="text-gray-400 text-sm mb-4">
                Choose a player with a complete profile to create a pitch.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {players.map((player) => (
                <Card 
                  key={player.id} 
                  className={`border cursor-pointer transition-colors ${
                    selectedPlayer?.id === player.id 
                      ? 'border-rosegold bg-rosegold/5' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedPlayer(player)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={player.photo_url} alt={player.full_name} />
                        <AvatarFallback className="bg-gray-700 text-white">
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{player.full_name}</h4>
                        <p className="text-sm text-gray-400">{player.position} • Age {player.age}</p>
                        <p className="text-sm text-gray-500">{player.citizenship}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-rosegold">${player.market_value?.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {players.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h4 className="text-lg font-medium text-white mb-2">No Eligible Players</h4>
                <p className="text-gray-400">
                  All players must have complete profiles before they can be pitched.
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        const playerVideos = getPlayerVideos();
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Select Videos</h3>
              <p className="text-gray-400 text-sm mb-4">
                Choose up to 6 videos featuring {selectedPlayer?.full_name}. At least 1 video is required.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {playerVideos.map((video) => (
                <Card 
                  key={video.id} 
                  className={`border cursor-pointer transition-colors ${
                    selectedVideos.includes(video.id) 
                      ? 'border-rosegold bg-rosegold/5' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => {
                    if (selectedVideos.includes(video.id)) {
                      setSelectedVideos(selectedVideos.filter(id => id !== video.id));
                    } else if (selectedVideos.length < 6) {
                      setSelectedVideos([...selectedVideos, video.id]);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{video.title}</h4>
                        <p className="text-xs text-gray-400">{video.duration}s</p>
                      </div>
                      {selectedVideos.includes(video.id) && (
                        <CheckCircle className="w-5 h-5 text-rosegold" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {playerVideos.length === 0 && (
              <div className="text-center py-8">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h4 className="text-lg font-medium text-white mb-2">No Videos Available</h4>
                <p className="text-gray-400">
                  No videos found featuring {selectedPlayer?.full_name}. Upload and tag videos first.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Selected: {selectedVideos.length}/6</span>
              <Badge variant="outline" className="border-rosegold text-rosegold">
                {selectedVideos.length} videos selected
              </Badge>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Transfer Details</h3>
              <p className="text-gray-400 text-sm mb-4">
                Set the transfer terms and financial details for {selectedPlayer?.full_name}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Transfer Type</Label>
                <Select 
                  value={transferDetails.transferType} 
                  onValueChange={(value: 'permanent' | 'loan') => 
                    setTransferDetails({ ...transferDetails, transferType: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent Transfer</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Currency</Label>
                <Select 
                  value={transferDetails.currency} 
                  onValueChange={(value) => 
                    setTransferDetails({ ...transferDetails, currency: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
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

            {transferDetails.transferType === 'permanent' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Asking Price *</Label>
                  <Input
                    type="number"
                    value={transferDetails.askingPrice}
                    onChange={(e) => setTransferDetails({ 
                      ...transferDetails, 
                      askingPrice: parseInt(e.target.value) || 0 
                    })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-white">Sign-on Bonus</Label>
                  <Input
                    type="number"
                    value={transferDetails.signOnBonus}
                    onChange={(e) => setTransferDetails({ 
                      ...transferDetails, 
                      signOnBonus: parseInt(e.target.value) || 0 
                    })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-white">Performance Bonus</Label>
                  <Input
                    type="number"
                    value={transferDetails.performanceBonus}
                    onChange={(e) => setTransferDetails({ 
                      ...transferDetails, 
                      performanceBonus: parseInt(e.target.value) || 0 
                    })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-white">Player Salary (Monthly)</Label>
                  <Input
                    type="number"
                    value={transferDetails.playerSalary}
                    onChange={(e) => setTransferDetails({ 
                      ...transferDetails, 
                      playerSalary: parseInt(e.target.value) || 0 
                    })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-white">Relocation Support</Label>
                  <Input
                    type="number"
                    value={transferDetails.relocationSupport}
                    onChange={(e) => setTransferDetails({ 
                      ...transferDetails, 
                      relocationSupport: parseInt(e.target.value) || 0 
                    })}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Loan Fee *</Label>
                    <Input
                      type="number"
                      value={transferDetails.loanFee}
                      onChange={(e) => setTransferDetails({ 
                        ...transferDetails, 
                        loanFee: parseInt(e.target.value) || 0 
                      })}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Player Salary (Monthly)</Label>
                    <Input
                      type="number"
                      value={transferDetails.playerSalary}
                      onChange={(e) => setTransferDetails({ 
                        ...transferDetails, 
                        playerSalary: parseInt(e.target.value) || 0 
                      })}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* Loan options would go here */}
              </div>
            )}

            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={transferDetails.description}
                onChange={(e) => setTransferDetails({ 
                  ...transferDetails, 
                  description: e.target.value 
                })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Additional details about this transfer pitch..."
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Review & Publish</h3>
              <p className="text-gray-400 text-sm mb-4">
                Review all details before publishing your transfer pitch.
              </p>
            </div>

            {/* Preview content would go here */}
            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Pitch Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedPlayer?.photo_url} alt={selectedPlayer?.full_name} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-lg font-medium text-white">{selectedPlayer?.full_name}</h4>
                    <p className="text-gray-400">{selectedPlayer?.position} • Age {selectedPlayer?.age}</p>
                    <p className="text-rosegold">Market Value: ${selectedPlayer?.market_value?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <p className="text-gray-400 text-sm">Transfer Type</p>
                    <p className="text-white capitalize">{transferDetails.transferType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">
                      {transferDetails.transferType === 'permanent' ? 'Asking Price' : 'Loan Fee'}
                    </p>
                    <p className="text-white">
                      {transferDetails.currency} {
                        (transferDetails.transferType === 'permanent' 
                          ? transferDetails.askingPrice 
                          : transferDetails.loanFee
                        ).toLocaleString()
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Videos Attached</p>
                    <p className="text-white">{selectedVideos.length} videos</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Expires</p>
                    <p className="text-white">30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rosegold" />
            Create Transfer Pitch
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNumber <= step 
                  ? 'bg-rosegold text-black' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <ArrowRight className={`w-4 h-4 ${
                  stepNumber < step ? 'text-rosegold' : 'text-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
            className="border-gray-600 text-gray-300"
            disabled={loading}
          >
            {step === 1 ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </>
            )}
          </Button>

          <div className="text-sm text-gray-400">
            Step {step} of 4
          </div>

          <Button
            onClick={step === 4 ? handleSubmit : handleNext}
            className="bg-rosegold text-black hover:bg-rosegold/90"
            disabled={loading}
          >
            {step === 4 ? (
              loading ? 'Creating...' : 'Publish Pitch'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePitchModal;
