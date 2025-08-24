import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Calendar,
  MapPin,
  Ruler,
  Weight,
  DollarSign,
  Video,
  Star,
  Trophy,
  Target,
  Edit,
  Image,
  Upload,
  Plus,
  Trash2,
  Eye,
  Download,
  Play,
  X,
  Award,
  Heart,
  Activity,
  FileText,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;
type DatabaseVideo = Tables<'videos'>;

interface PlayerPhoto {
  id: string;
  url: string;
  title: string;
  description?: string;
  uploaded_at: string;
  type: 'headshot' | 'action' | 'team' | 'other';
}

interface PlayerDetailPageProps {
  player: DatabasePlayer;
  onEdit?: () => void;
}

const PlayerDetailPage: React.FC<PlayerDetailPageProps> = ({
  player,
  onEdit
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [photos, setPhotos] = useState<PlayerPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [isOwnPlayer, setIsOwnPlayer] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PlayerPhoto | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    if (player) {
      calculateAge();
      checkOwnership();
      fetchPlayerVideos();
      fetchPlayerPhotos();
    }
  }, [player, profile]);

  const calculateAge = () => {
    if (player.date_of_birth) {
      const birthDate = new Date(player.date_of_birth);
      const today = new Date();
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setAge(calculatedAge - 1);
      } else {
        setAge(calculatedAge);
      }
    }
  };

  const checkOwnership = async () => {
    if (!profile?.id) return;

    try {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (team && team.id === player.team_id) {
        setIsOwnPlayer(true);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const fetchPlayerVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', player.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerPhotos = async () => {
    try {
      setPhotoLoading(true);

      // Fetch photos from storage bucket
      const { data: photoFiles, error } = await supabase.storage
        .from('player-photos')
        .list(`players/${player.id}`, {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      // Create photo objects with metadata
      const photoList: PlayerPhoto[] = photoFiles
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map((file, index) => ({
          id: file.id || `photo-${index}`,
          url: `${supabase.storage.from('player-photos').getPublicUrl(`players/${player.id}/${file.name}`).data.publicUrl}`,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          description: `Photo uploaded on ${new Date(file.updated_at).toLocaleDateString()}`,
          uploaded_at: file.updated_at,
          type: getPhotoType(file.name)
        }));

      // Add existing photo URLs from player data
      const existingPhotos: PlayerPhoto[] = [];

      if (player.photo_url) {
        existingPhotos.push({
          id: 'main-photo',
          url: player.photo_url,
          title: 'Main Photo',
          description: 'Primary player photo',
          uploaded_at: new Date().toISOString(),
          type: 'headshot'
        });
      }

      if (player.headshot_url) {
        existingPhotos.push({
          id: 'headshot-photo',
          url: player.headshot_url,
          title: 'Headshot',
          description: 'Professional headshot',
          uploaded_at: new Date().toISOString(),
          type: 'headshot'
        });
      }

      setPhotos([...existingPhotos, ...photoList]);
    } catch (error) {
      console.error('Error fetching player photos:', error);
    } finally {
      setPhotoLoading(false);
    }
  };

  const getPhotoType = (filename: string): 'headshot' | 'action' | 'team' | 'other' => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('headshot') || lowerName.includes('portrait')) return 'headshot';
    if (lowerName.includes('action') || lowerName.includes('game')) return 'action';
    if (lowerName.includes('team') || lowerName.includes('group')) return 'team';
    return 'other';
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setPhotoLoading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `players/${player.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('player-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          continue;
        }

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      }

      // Refresh photos
      fetchPlayerPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive"
      });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extract filename from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `players/${player.id}/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from('player-photos')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting photo:', error);
        toast({
          title: "Error",
          description: "Failed to delete photo",
          variant: "destructive"
        });
        return;
      }

      // Remove from local state
      setPhotos(photos.filter(photo => photo.id !== photoId));

      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Player Header */}
      <div className="flex items-start gap-6">
        <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
          {player.headshot_url || player.photo_url ? (
            <img
              src={player.headshot_url || player.photo_url}
              alt={player.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-polysans text-white">{player.full_name}</h2>
            {isOwnPlayer && onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-rosegold border-rosegold text-lg px-3 py-1">
              {player.position}
            </Badge>
            {player.jersey_number && (
              <Badge variant="outline" className="text-blue-400 border-blue-400 text-lg px-3 py-1">
                #{player.jersey_number}
              </Badge>
            )}
            <Badge variant="outline" className="text-gray-300 border-gray-300">
              {player.gender?.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-400">Age</p>
                <p className="text-white font-semibold">{age || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-400">Nationality</p>
                <p className="text-white font-semibold">{player.citizenship}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-400">Market Value</p>
                <p className="text-white font-semibold">
                  {player.market_value ? formatCurrency(player.market_value) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-gray-800">
          <TabsTrigger value="overview" className="text-white">
            <User className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="career" className="text-white">
            <TrendingUp className="h-4 w-4 mr-1" />
            Career
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-white">
            <Activity className="h-4 w-4 mr-1" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="videos" className="text-white">
            <Video className="h-4 w-4 mr-1" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="awards" className="text-white">
            <Award className="h-4 w-4 mr-1" />
            Awards
          </TabsTrigger>
          <TabsTrigger value="medical" className="text-white">
            <Heart className="h-4 w-4 mr-1" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-white">
            <FileText className="h-4 w-4 mr-1" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Basic Information Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Age</p>
                    <p className="text-white font-semibold">{age || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Nationality</p>
                    <p className="text-white font-semibold">{player.citizenship}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Height</p>
                    <p className="text-white font-semibold">{player.height ? `${player.height} cm` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Weight</p>
                    <p className="text-white font-semibold">{player.weight ? `${player.weight} kg` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Position</p>
                    <p className="text-white font-semibold">{player.position}</p>
                  </div>
                </div>
                {player.foot && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Preferred Foot</p>
                      <p className="text-white font-semibold capitalize">{player.foot}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Club Information */}
          {player.current_club && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white font-polysans">Current Club</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Club Name</p>
                    <p className="text-white font-semibold">{player.current_club}</p>
                  </div>
                  {player.jersey_number && (
                    <div>
                      <p className="text-gray-400 text-sm">Jersey Number</p>
                      <p className="text-white font-semibold">#{player.jersey_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Biography */}
          {player.bio && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white font-polysans">Biography</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 font-poppins leading-relaxed">{player.bio}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Career History Tab */}
        <TabsContent value="career" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Career Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {player.current_club && (
                  <div>
                    <p className="text-gray-400 text-sm">Current Club</p>
                    <p className="text-white font-semibold">{player.current_club}</p>
                  </div>
                )}
                {player.contract_expires && (
                  <div>
                    <p className="text-gray-400 text-sm">Contract Expires</p>
                    <p className="text-white font-semibold">{formatDate(player.contract_expires)}</p>
                  </div>
                )}
                {player.joined_date && (
                  <div>
                    <p className="text-gray-400 text-sm">Joined Date</p>
                    <p className="text-white font-semibold">{formatDate(player.joined_date)}</p>
                  </div>
                )}
                {player.market_value && (
                  <div>
                    <p className="text-gray-400 text-sm">Market Value</p>
                    <p className="text-white font-semibold">{formatCurrency(player.market_value)}</p>
                  </div>
                )}
                {player.player_agent && (
                  <div>
                    <p className="text-gray-400 text-sm">Agent</p>
                    <p className="text-white font-semibold">{player.player_agent}</p>
                  </div>
                )}
                {player.fifa_id && (
                  <div>
                    <p className="text-gray-400 text-sm">FIFA ID</p>
                    <p className="text-white font-semibold">{player.fifa_id}</p>
                  </div>
                )}
              </div>

              {/* Leagues Participated */}
              {player.leagues_participated && player.leagues_participated.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Leagues Participated</p>
                  <div className="flex flex-wrap gap-2">
                    {player.leagues_participated.map((league, index) => (
                      <Badge key={index} variant="outline" className="text-blue-400 border-blue-400">
                        {league}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Transfer History */}
              {player.transfer_history && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Transfer History</p>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                      {JSON.stringify(player.transfer_history, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {player.match_stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(player.match_stats as Record<string, any>).map(([key, value]) => (
                    <div key={key} className="text-center bg-gray-700 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-rosegold">{value}</p>
                      <p className="text-gray-400 text-sm capitalize">{key.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No statistics available</p>
              )}
            </CardContent>
          </Card>

          {/* International Duty */}
          {player.international_duty && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white font-polysans">International Duty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                    {JSON.stringify(player.international_duty, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {player.ai_analysis && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white font-polysans flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  AI Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(player.ai_analysis as Record<string, any>).map(([key, value]) => (
                    <div key={key} className="border-l-4 border-rosegold pl-4">
                      <p className="text-gray-400 text-sm capitalize font-medium">{key.replace('_', ' ')}</p>
                      <p className="text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          {/* Upload Section */}
          {isOwnPlayer && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white font-polysans flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Upload training videos, match highlights, and skill demonstrations to showcase this player's abilities.
                </p>
                <Button className="bg-rosegold hover:bg-rosegold/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Videos Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">No videos available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-rosegold/50 transition-colors group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-700 rounded-lg mb-3 relative overflow-hidden">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h4 className="text-white font-polysans font-semibold truncate">{video.title}</h4>
                    {video.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{video.duration ? `${video.duration}s` : 'N/A'}</span>
                      <span>{video.video_type || 'highlight'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Awards & Achievements Tab */}
        <TabsContent value="awards" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Titles & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {player.titles_seasons && player.titles_seasons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {player.titles_seasons.map((title, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">{title}</p>
                        <p className="text-gray-400 text-sm">Achievement</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No awards or achievements recorded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Career Highlights */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans">Career Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {player.market_value && (
                  <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <Star className="h-5 w-5 text-rosegold" />
                    <div>
                      <p className="text-white font-semibold">Market Value</p>
                      <p className="text-gray-400 text-sm">{formatCurrency(player.market_value)}</p>
                    </div>
                  </div>
                )}
                {player.leagues_participated && player.leagues_participated.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <Target className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-semibold">Leagues Participated</p>
                      <p className="text-gray-400 text-sm">{player.leagues_participated.length} leagues</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical & Fitness Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" />
                Physical Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <Ruler className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-white font-semibold text-lg">{player.height ? `${player.height} cm` : 'N/A'}</p>
                  <p className="text-gray-400 text-sm">Height</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <Weight className="h-6 w-6 mx-auto mb-2 text-green-400" />
                  <p className="text-white font-semibold text-lg">{player.weight ? `${player.weight} kg` : 'N/A'}</p>
                  <p className="text-gray-400 text-sm">Weight</p>
                </div>
                {player.date_of_birth && (
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                    <p className="text-white font-semibold text-lg">{age || 'N/A'}</p>
                    <p className="text-gray-400 text-sm">Age</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Fitness Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">No medical or fitness data available</p>
                {isOwnPlayer && (
                  <p className="text-gray-500 text-sm mt-2">Add injury history and fitness assessments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scouting Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Scouting Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOwnPlayer ? (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 mb-4">No scouting notes available</p>
                    <Button className="bg-rosegold hover:bg-rosegold/90 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Scouting Note
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Scouting notes are private to the team</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player Ratings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans">Internal Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              {isOwnPlayer ? (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 mb-4">No internal ratings set</p>
                    <Button variant="outline" className="border-gray-600 text-gray-400">
                      Set Player Rating
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Star className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Internal ratings are private to the team</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Modal */}
      {selectedPhoto && (
        <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
          <DialogContent className="max-w-4xl bg-[#1a1a1a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white font-polysans flex items-center justify-between">
                <span>{selectedPhoto.title}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedPhoto.url;
                      link.download = selectedPhoto.title;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPhotoModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-contain"
                />
              </div>
              {selectedPhoto.description && (
                <p className="text-gray-300">{selectedPhoto.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Type: {selectedPhoto.type}</span>
                <span>Uploaded: {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PlayerDetailPage;
