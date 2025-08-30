
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { usePlayerData } from '@/hooks/usePlayerData';
import { usePlayerVideoTags } from '@/hooks/usePlayerVideoTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  MapPin, 
  Ruler, 
  Weight, 
  Trophy, 
  Flag,
  Building,
  Clock,
  FileText,
  Activity
} from 'lucide-react';
import Layout from './Layout';

const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const location = useLocation();
  const playerName = location.state?.playerName;

  const { player, loading, error } = usePlayerData(playerId || null);
  const { videos, loading: videosLoading } = usePlayerVideoTags(playerId || '');

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-700 rounded-lg"></div>
              <div className="h-64 bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !player) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-500/20 bg-red-950/10">
            <CardContent className="p-6 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Player Not Found
              </h2>
              <p className="text-gray-400">
                {error || 'The requested player profile could not be found.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-bright-pink/10 to-rosegold/10 border-bright-pink/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={player.profile_image} 
                  alt={player.full_name}
                />
                <AvatarFallback className="bg-bright-pink text-white text-2xl">
                  {getInitials(player.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {player.full_name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-300">
                  {player.position && (
                    <Badge variant="secondary" className="bg-bright-pink text-white">
                      {player.position}
                    </Badge>
                  )}
                  
                  {player.jersey_number && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm">Jersey #</span>
                      <span className="font-semibold">{player.jersey_number}</span>
                    </div>
                  )}
                  
                  {player.team && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span>{player.team}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {player.age && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Age: {player.age} years</span>
                </div>
              )}
              
              {player.nationality && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Flag className="w-4 h-4" />
                  <span>Nationality: {player.nationality}</span>
                </div>
              )}
              
              {player.height && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Ruler className="w-4 h-4" />
                  <span>Height: {player.height}</span>
                </div>
              )}
              
              {player.weight && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Weight className="w-4 h-4" />
                  <span>Weight: {player.weight}</span>
                </div>
              )}
              
              {player.preferred_foot && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Activity className="w-4 h-4" />
                  <span>Preferred Foot: {player.preferred_foot}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Career Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5" />
                Career Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {player.current_club && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Building className="w-4 h-4" />
                  <span>Current Club: {player.current_club}</span>
                </div>
              )}
              
              {player.market_value && (
                <div className="flex items-center gap-2 text-gray-300">
                  <span>Market Value: ${player.market_value.toLocaleString()}</span>
                </div>
              )}
              
              {player.contract_expires && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Contract Expires: {new Date(player.contract_expires).toLocaleDateString()}</span>
                </div>
              )}
              
              {player.achievements && player.achievements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-gray-300 mb-2">
                    <Trophy className="w-4 h-4" />
                    <span>Achievements:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {player.achievements.map((achievement, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Biography */}
        {player.bio && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5" />
                Biography
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{player.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Videos */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5" />
              Tagged Videos ({videos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {videosLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="space-y-3">
                {videos.map((video) => (
                  <div key={video.id} className="p-3 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white">{video.title}</h4>
                    {video.team_name && (
                      <p className="text-sm text-gray-400">Team: {video.team_name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No videos found for this player.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PlayerProfilePage;
