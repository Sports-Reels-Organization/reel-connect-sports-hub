
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Play,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Clock,
  Star
} from 'lucide-react';

interface PitchDetails {
  id: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  deal_stage: string;
  expires_at: string;
  created_at: string;
  description?: string;
  is_international: boolean;
  tagged_videos: any[];
  view_count: number;
  message_count: number;
  shortlist_count: number;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    photo_url?: string;
    age?: number;
    height?: number;
    weight?: number;
    market_value?: number;
    bio?: string;
    foot?: string;
  };
  teams: {
    id: string;
    team_name: string;
    logo_url?: string;
    country: string;
    league?: string;
    description?: string;
  };
}

const TransferPitchDetails: React.FC = () => {
  const { pitchId } = useParams<{ pitchId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pitch, setPitch] = useState<PitchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    if (pitchId) {
      fetchPitchDetails();
      checkShortlistStatus();
      incrementViewCount();
    }
  }, [pitchId]);

  const fetchPitchDetails = async () => {
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
            photo_url,
            age,
            height,
            weight,
            market_value,
            bio,
            foot
          ),
          teams!inner(
            id,
            team_name,
            logo_url,
            country,
            league,
            description
          )
        `)
        .eq('id', pitchId)
        .single();

      if (error) throw error;

      // Process tagged_videos to ensure it's an array
      const processedData = {
        ...data,
        tagged_videos: Array.isArray(data.tagged_videos) ? data.tagged_videos : []
      };

      setPitch(processedData);
    } catch (error) {
      console.error('Error fetching pitch details:', error);
      toast({
        title: "Error",
        description: "Failed to load pitch details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkShortlistStatus = async () => {
    if (!profile || profile.user_type !== 'agent') return;

    try {
      // Get agent ID first
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      const { data, error } = await supabase
        .from('shortlist')
        .select('id')
        .eq('agent_id', agentData.id)
        .eq('pitch_id', pitchId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsShortlisted(!!data);
    } catch (error) {
      console.error('Error checking shortlist status:', error);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment_pitch_view_count', { pitch_uuid: pitchId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleShortlist = async () => {
    if (!profile || profile.user_type !== 'agent') return;

    try {
      // Get agent ID first
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      if (isShortlisted) {
        await supabase
          .from('shortlist')
          .delete()
          .eq('agent_id', agentData.id)
          .eq('pitch_id', pitchId);
        setIsShortlisted(false);
        toast({ title: "Removed from shortlist" });
      } else {
        await supabase
          .from('shortlist')
          .insert({
            agent_id: agentData.id,
            pitch_id: pitchId,
            player_id: pitch?.players.id,
            notes: ''
          });
        setIsShortlisted(true);
        toast({ title: "Added to shortlist" });
      }
    } catch (error) {
      console.error('Error updating shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to update shortlist",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold"></div>
        </div>
      </Layout>
    );
  }

  if (!pitch) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Pitch Not Found</h2>
          <Button onClick={() => navigate('/explore')}>
            Back to Timeline
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {pitch.view_count} views
            </Badge>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Player Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    {pitch.players.photo_url ? (
                      <img
                        src={pitch.players.photo_url}
                        alt={pitch.players.full_name}
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Users className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                          {pitch.players.full_name}
                        </h1>
                        <div className="flex items-center gap-4 text-gray-300">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {pitch.players.position}
                          </span>
                          <span>{pitch.players.citizenship}</span>
                          {pitch.players.age && <span>{pitch.players.age} years old</span>}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-rosegold mb-1">
                          {formatCurrency(pitch.asking_price, pitch.currency)}
                        </div>
                        <Badge className="bg-blue-500 text-white">
                          {pitch.transfer_type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Player Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {pitch.players.height && (
                        <div>
                          <span className="text-gray-400">Height:</span>
                          <p className="font-medium">{pitch.players.height}cm</p>
                        </div>
                      )}
                      {pitch.players.weight && (
                        <div>
                          <span className="text-gray-400">Weight:</span>
                          <p className="font-medium">{pitch.players.weight}kg</p>
                        </div>
                      )}
                      {pitch.players.foot && (
                        <div>
                          <span className="text-gray-400">Foot:</span>
                          <p className="font-medium capitalize">{pitch.players.foot}</p>
                        </div>
                      )}
                      {pitch.players.market_value && (
                        <div>
                          <span className="text-gray-400">Market Value:</span>
                          <p className="font-medium">
                            {formatCurrency(pitch.players.market_value, pitch.currency)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="videos">Videos ({pitch.tagged_videos.length})</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                {/* Team Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Current Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {pitch.teams.logo_url && (
                        <img
                          src={pitch.teams.logo_url}
                          alt={pitch.teams.team_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {pitch.teams.team_name}
                        </h3>
                        <p className="text-gray-400">{pitch.teams.country}</p>
                        {pitch.teams.league && (
                          <p className="text-sm text-gray-500">{pitch.teams.league}</p>
                        )}
                      </div>
                    </div>
                    {pitch.teams.description && (
                      <p className="mt-4 text-gray-300">{pitch.teams.description}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Player Bio */}
                {pitch.players.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Player Biography</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{pitch.players.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Pitch Description */}
                {pitch.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Transfer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{pitch.description}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="videos">
                <Card>
                  <CardHeader>
                    <CardTitle>Player Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pitch.tagged_videos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pitch.tagged_videos.map((video, index) => (
                          <div key={index} className="bg-gray-800 rounded-lg p-4">
                            <div className="aspect-video bg-gray-700 rounded mb-2 flex items-center justify-center">
                              <Play className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium">{video.title || `Video ${index + 1}`}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Play className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-gray-400">No videos available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-400">Views</p>
                          <p className="text-xl font-bold">{pitch.view_count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-400">Messages</p>
                          <p className="text-xl font-bold">{pitch.message_count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-sm text-gray-400">Shortlisted</p>
                          <p className="text-xl font-bold">{pitch.shortlist_count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile?.user_type === 'agent' && (
                  <>
                    <Button
                      className="w-full bg-rosegold hover:bg-rosegold/90"
                      size="lg"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    
                    <Button
                      variant={isShortlisted ? "default" : "outline"}
                      className="w-full"
                      onClick={handleShortlist}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isShortlisted ? 'fill-current' : ''}`} />
                      {isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                    </Button>
                  </>
                )}
                
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Watch Videos
                </Button>
              </CardContent>
            </Card>

            {/* Pitch Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pitch Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Status:</span>
                  <Badge className="ml-2 bg-blue-500 text-white">
                    {pitch.deal_stage.toUpperCase()}
                  </Badge>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">Expires:</span>
                  <p className="font-medium">
                    {new Date(pitch.expires_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">Posted:</span>
                  <p className="font-medium">
                    {new Date(pitch.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {pitch.is_international && (
                  <div>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      International Transfer
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Interested?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">
                  Contact the team to discuss this transfer opportunity.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>{pitch.teams.team_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{pitch.teams.country}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransferPitchDetails;
