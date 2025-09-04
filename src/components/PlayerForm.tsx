import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useSports } from '@/hooks/useSports';
import { useSportData, getSportDisplayName, getSportIcon } from '@/hooks/useSportData';
import { Plus, X, Upload, MapPin, Trophy, Users, Calendar, DollarSign, Flag } from 'lucide-react';

type DatabasePlayer = Tables<'players'>;

interface PlayerFormProps {
  player?: DatabasePlayer | null;
  onSave: () => void;
  onCancel: () => void;
  teamId: string;
}


interface TransferHistory {
  year: string;
  club: string;
  transfer_value: string;
}

interface InternationalDuty {
  season: string;
  category: string;
  country: string;
  debut: string;
  appearances: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  second_yellow: number;
  red_cards: number;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ player, onSave, onCancel, teamId }) => {
  const { toast } = useToast();
  const { sports } = useSports();
  const [loading, setLoading] = useState(false);
  const [teamSport, setTeamSport] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    full_name: player?.full_name || '',
    position: player?.position || '',
    jersey_number: player?.jersey_number?.toString() || '',
    date_of_birth: player?.date_of_birth || '',
    citizenship: player?.citizenship || '',
    place_of_birth: player?.place_of_birth || '',
    height: player?.height?.toString() || '',
    weight: player?.weight?.toString() || '',
    foot: player?.foot || '',
    fifa_id: player?.fifa_id || '',
    bio: player?.bio || '',
    market_value: player?.market_value?.toString() || '',
    player_agent: player?.player_agent || '',
    current_club: player?.current_club || '',
    contract_expires: player?.contract_expires || '',
    joined_date: player?.joined_date || '',
    gender: player?.gender || 'male' as const,
    photo_url: player?.photo_url || '',
    headshot_url: player?.headshot_url || '',
    portrait_url: player?.portrait_url || '',
    full_body_url: player?.full_body_url || '',
    leagues_participated: player?.leagues_participated || [],
    titles_seasons: player?.titles_seasons || [],
    transfer_history: Array.isArray(player?.transfer_history) ? (player.transfer_history as unknown as TransferHistory[]) : [],
    international_duty: Array.isArray(player?.international_duty) ? (player.international_duty as unknown as InternationalDuty[]) : [],
    match_stats: player?.match_stats || null
  });

  const [newLeague, setNewLeague] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTransfer, setNewTransfer] = useState({ year: '', club: '', transfer_value: '' });
  const [newInternational, setNewInternational] = useState({
    season: '', category: '', country: '', debut: '', appearances: 0, goals: 0, assists: 0, yellow_cards: 0, second_yellow: 0, red_cards: 0
  });

  // Get sport-specific data based on team sport and player gender
  const sportData = useSportData(teamSport, formData.gender);

  useEffect(() => {
    fetchTeamSport();
  }, [teamId]);

  const fetchTeamSport = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('sport_type')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error fetching team sport:', error);
        return;
      }

      setTeamSport(data.sport_type);
    } catch (error) {
      console.error('Error fetching team sport:', error);
    }
  };

  // Helper function to check if sport is football
  const isFootballSport = (sportType: string): boolean => {
    return sportType === 'football';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.position || !formData.citizenship) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Position, Citizenship)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const playerData = {
        team_id: teamId,
        full_name: formData.full_name,
        position: formData.position,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        date_of_birth: formData.date_of_birth || null,
        citizenship: formData.citizenship,
        place_of_birth: formData.place_of_birth || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        foot: isFootballSport(teamSport) ? formData.foot || null : null,
        fifa_id: isFootballSport(teamSport) ? formData.fifa_id || null : null,
        bio: formData.bio || null,
        market_value: formData.market_value ? parseFloat(formData.market_value) : null,
        player_agent: formData.player_agent || null,
        current_club: formData.current_club || null,
        contract_expires: formData.contract_expires || null,
        joined_date: formData.joined_date || null,
        gender: formData.gender,
        photo_url: formData.photo_url || null,
        headshot_url: formData.headshot_url || null,
        portrait_url: formData.portrait_url || null,
        full_body_url: formData.full_body_url || null,
        leagues_participated: formData.leagues_participated,
        titles_seasons: formData.titles_seasons,
        transfer_history: formData.transfer_history as any,
        international_duty: formData.international_duty as any,
        match_stats: formData.match_stats
      };

      let error;
      if (player) {
        const result = await supabase
          .from('players')
          .update(playerData)
          .eq('id', player.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('players')
          .insert(playerData);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Player ${player ? 'updated' : 'created'} successfully`,
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving player:', error);
      toast({
        title: "Error",
        description: `Failed to ${player ? 'update' : 'create'} player: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addLeague = () => {
    if (newLeague && !formData.leagues_participated.includes(newLeague)) {
      setFormData({
        ...formData,
        leagues_participated: [...formData.leagues_participated, newLeague]
      });
      setNewLeague('');
    }
  };

  const removeLeague = (league: string) => {
    setFormData({
      ...formData,
      leagues_participated: formData.leagues_participated.filter(l => l !== league)
    });
  };

  const addTitle = () => {
    if (newTitle && !formData.titles_seasons.includes(newTitle)) {
      setFormData({
        ...formData,
        titles_seasons: [...formData.titles_seasons, newTitle]
      });
      setNewTitle('');
    }
  };

  const removeTitle = (title: string) => {
    setFormData({
      ...formData,
      titles_seasons: formData.titles_seasons.filter(t => t !== title)
    });
  };

  const addTransfer = () => {
    if (newTransfer.year && newTransfer.club) {
      setFormData({
        ...formData,
        transfer_history: [...formData.transfer_history, { ...newTransfer }]
      });
      setNewTransfer({ year: '', club: '', transfer_value: '' });
    }
  };

  const removeTransfer = (index: number) => {
    setFormData({
      ...formData,
      transfer_history: formData.transfer_history.filter((_, i) => i !== index)
    });
  };

  const addInternational = () => {
    if (newInternational.season && newInternational.country) {
      setFormData({
        ...formData,
        international_duty: [...formData.international_duty, { ...newInternational }]
      });
      setNewInternational({
        season: '', category: '', country: '', debut: '', appearances: 0, goals: 0, assists: 0, yellow_cards: 0, second_yellow: 0, red_cards: 0
      });
    }
  };

  const removeInternational = (index: number) => {
    setFormData({
      ...formData,
      international_duty: formData.international_duty.filter((_, i) => i !== index)
    });
  };

  const isFootball = isFootballSport(teamSport);

  return (
    <Card className="w-full max-w-6xl mx-auto bg-[#1a1a1a] border-0">
      <CardHeader>
        <CardTitle className="text-white font-polysans flex items-center gap-2">
          <span>{getSportIcon(teamSport)}</span>
          {player ? 'Edit Player Profile' : 'Add New Player'}
          {teamSport && (
            <Badge variant="outline" className="ml-2 text-rosegold border-rosegold">
              {getSportDisplayName(teamSport)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card border-0">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="career"
                className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Career
              </TabsTrigger>
              <TabsTrigger
                value="international"
                className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
              >
                <Flag className="w-4 h-4 mr-2" />
                International
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Media
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-white">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="Player's full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-white">Primary Position *</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger className="bg-[#111111] border-0 text-white">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-0">
                      {sportData.positions.map((position) => (
                        <SelectItem key={position} value={position} className="text-white">
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jersey_number" className="text-white">Jersey Number</Label>
                  <Input
                    id="jersey_number"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.jersey_number}
                    onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="1-99"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger className="bg-[#111111] border-0 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-0">
                      <SelectItem value="male" className="text-white">Male</SelectItem>
                      <SelectItem value="female" className="text-white">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-white">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citizenship" className="text-white">Citizenship *</Label>
                  <CountrySelect
                    value={formData.citizenship}
                    onValueChange={(value) => setFormData({ ...formData, citizenship: value })}
                    placeholder="Select citizenship"
                    triggerClassName="bg-[#111111] border-0 text-white"
                    contentClassName="bg-[#1a1a1a] border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="place_of_birth" className="text-white">Place of Birth</Label>
                  <Input
                    id="place_of_birth"
                    value={formData.place_of_birth}
                    onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height" className="text-white">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="140"
                    max="220"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="e.g., 180"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-white">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="40"
                    max="150"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="e.g., 75"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="market_value" className="text-white">Current Market Value (USD)</Label>
                  <Input
                    id="market_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.market_value}
                    onChange={(e) => setFormData({ ...formData, market_value: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="e.g., 50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="player_agent" className="text-white">Player Agent</Label>
                  <Input
                    id="player_agent"
                    value={formData.player_agent}
                    onChange={(e) => setFormData({ ...formData, player_agent: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="Agent name (if any)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_club" className="text-white">Current Club</Label>
                  <Input
                    id="current_club"
                    value={formData.current_club}
                    onChange={(e) => setFormData({ ...formData, current_club: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="Current club name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joined_date" className="text-white">Joined Date</Label>
                  <Input
                    id="joined_date"
                    type="date"
                    value={formData.joined_date}
                    onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_expires" className="text-white">Contract Expires</Label>
                  <Input
                    id="contract_expires"
                    type="date"
                    value={formData.contract_expires}
                    onChange={(e) => setFormData({ ...formData, contract_expires: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                  />
                </div>

                {/* Football-specific fields */}
                {isFootball && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-white">Preferred Foot</Label>
                      <Select value={formData.foot} onValueChange={(value) => setFormData({ ...formData, foot: value })}>
                        <SelectTrigger className="bg-[#111111] border-0 text-white">
                          <SelectValue placeholder="Select preferred foot" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-0">
                          <SelectItem value="left" className="text-white">Left</SelectItem>
                          <SelectItem value="right" className="text-white">Right</SelectItem>
                          <SelectItem value="both" className="text-white">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fifa_id" className="text-white">FIFA ID</Label>
                      <Input
                        id="fifa_id"
                        value={formData.fifa_id}
                        onChange={(e) => setFormData({ ...formData, fifa_id: e.target.value })}
                        className="bg-[#111111] border-0 text-white"
                        placeholder="FIFA player ID (if available)"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Player Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="bg-[#111111] border-0 text-white resize-none"
                  placeholder="Brief description of the player's career and achievements..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Career Tab */}
            <TabsContent value="career" className="space-y-6">
              {/* Leagues Participated */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-rosegold" />
                  <Label className="text-white text-lg font-semibold">Leagues & Competitions</Label>
                </div>

                <div className="flex gap-2">
                  <Select value={newLeague} onValueChange={setNewLeague}>
                    <SelectTrigger className="bg-[#111111] border-0 text-white w-64">
                      <SelectValue placeholder="Select league" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-0">
                      {sportData.leagues.map((league) => (
                        <SelectItem key={league} value={league} className="text-white">
                          {league}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addLeague} className="bg-rosegold hover:bg-rosegold/90">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.leagues_participated.map((league, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-700 text-white">
                      {league}
                      <button
                        type="button"
                        onClick={() => removeLeague(league)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Titles and Seasons */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-rosegold" />
                  <Label className="text-white text-lg font-semibold">Titles & Seasons</Label>
                </div>

                <div className="flex gap-2">
                  <Select value={newTitle} onValueChange={setNewTitle}>
                    <SelectTrigger className="bg-[#111111] border-0 text-white w-64">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-0">
                      {sportData.titles.map((title) => (
                        <SelectItem key={title} value={title} className="text-white">
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addTitle} className="bg-rosegold hover:bg-rosegold/90">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.titles_seasons.map((title, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-700 text-white">
                      {title}
                      <button
                        type="button"
                        onClick={() => removeTitle(title)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Transfer History */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-rosegold" />
                  <Label className="text-white text-lg font-semibold">Transfer History</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={newTransfer.year}
                    onChange={(e) => setNewTransfer({ ...newTransfer, year: e.target.value })}
                    placeholder="Year"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newTransfer.club}
                    onChange={(e) => setNewTransfer({ ...newTransfer, club: e.target.value })}
                    placeholder="Club"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newTransfer.transfer_value}
                      onChange={(e) => setNewTransfer({ ...newTransfer, transfer_value: e.target.value })}
                      placeholder="Transfer Value"
                      className="bg-[#111111] border-0 text-white"
                    />
                    <Button type="button" onClick={addTransfer} className="bg-rosegold hover:bg-rosegold/90">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.transfer_history.map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex gap-4">
                        <span className="text-white">{transfer.year}</span>
                        <span className="text-gray-300">{transfer.club}</span>
                        <span className="text-green-400">${transfer.transfer_value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTransfer(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* International Duty Tab */}
            <TabsContent value="international" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-rosegold" />
                  <Label className="text-white text-lg font-semibold">International Duty</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    value={newInternational.season}
                    onChange={(e) => setNewInternational({ ...newInternational, season: e.target.value })}
                    placeholder="Season"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newInternational.category}
                    onChange={(e) => setNewInternational({ ...newInternational, category: e.target.value })}
                    placeholder="Category"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <CountrySelect
                    value={newInternational.country}
                    onValueChange={(value) => setNewInternational({ ...newInternational, country: value })}
                    placeholder="Country"
                    triggerClassName="bg-[#111111] border-0 text-white"
                    contentClassName="bg-[#1a1a1a] border-0"
                  />
                  <Input
                    value={newInternational.debut}
                    onChange={(e) => setNewInternational({ ...newInternational, debut: e.target.value })}
                    placeholder="Debut Date"
                    type="date"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newInternational.appearances.toString()}
                    onChange={(e) => setNewInternational({ ...newInternational, appearances: parseInt(e.target.value) || 0 })}
                    placeholder="Appearances"
                    type="number"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newInternational.goals.toString()}
                    onChange={(e) => setNewInternational({ ...newInternational, goals: parseInt(e.target.value) || 0 })}
                    placeholder="Goals"
                    type="number"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newInternational.assists.toString()}
                    onChange={(e) => setNewInternational({ ...newInternational, assists: parseInt(e.target.value) || 0 })}
                    placeholder="Assists"
                    type="number"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newInternational.yellow_cards.toString()}
                    onChange={(e) => setNewInternational({ ...newInternational, yellow_cards: parseInt(e.target.value) || 0 })}
                    placeholder="Yellow Cards"
                    type="number"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newInternational.second_yellow.toString()}
                    onChange={(e) => setNewInternational({ ...newInternational, second_yellow: parseInt(e.target.value) || 0 })}
                    placeholder="Second Yellow"
                    type="number"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Input
                    value={newInternational.red_cards.toString()}
                    onChange={(e) => setNewInternational({ ...newInternational, red_cards: parseInt(e.target.value) || 0 })}
                    placeholder="Red Cards"
                    type="number"
                    className="bg-[#111111] border-0 text-white"
                  />
                  <Button type="button" onClick={addInternational} className="bg-rosegold hover:bg-rosegold/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add International Record
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.international_duty.map((duty, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">{duty.country} - {duty.season}</h4>
                        <button
                          type="button"
                          onClick={() => removeInternational(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <span className="text-gray-300">Category: {duty.category}</span>
                        <span className="text-gray-300">Debut: {duty.debut}</span>
                        <span className="text-gray-300">Apps: {duty.appearances}</span>
                        <span className="text-gray-300">Goals: {duty.goals}</span>
                        <span className="text-gray-300">Assists: {duty.assists}</span>
                        <span className="text-gray-300">YC: {duty.yellow_cards}</span>
                        <span className="text-gray-300">2YC: {duty.second_yellow}</span>
                        <span className="text-gray-300">RC: {duty.red_cards}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="photo_url" className="text-white">Player Photo URL</Label>
                  <Input
                    id="photo_url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="Main player photo URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headshot_url" className="text-white">Headshot URL</Label>
                  <Input
                    id="headshot_url"
                    value={formData.headshot_url}
                    onChange={(e) => setFormData({ ...formData, headshot_url: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="Professional headshot URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portrait_url" className="text-white">Portrait URL</Label>
                  <Input
                    id="portrait_url"
                    value={formData.portrait_url}
                    onChange={(e) => setFormData({ ...formData, portrait_url: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="Portrait photo URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_body_url" className="text-white">Full Body Photo URL</Label>
                  <Input
                    id="full_body_url"
                    value={formData.full_body_url}
                    onChange={(e) => setFormData({ ...formData, full_body_url: e.target.value })}
                    className="bg-[#111111] border-0 text-white"
                    placeholder="Full body photo URL"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 pt-6 border-t border-gray-700">
            <Button
              type="submit"
              disabled={loading}
              className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans border-0"
            >
              {loading ? 'Saving...' : (player ? 'Update Player' : 'Add Player')}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="border-0 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlayerForm;
