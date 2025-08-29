import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Heart, MessageSquare, Eye, Clock, DollarSign,
  MapPin, User, Trash2, Star, Filter, Search,
  Play, BarChart3, Download, Share, AlertCircle,
  Calendar, TrendingUp, FileText, Settings,
  Bookmark, Tag, Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EnhancedVideoAnalysis from './EnhancedVideoAnalysis';
import { usePlayerData } from '@/hooks/usePlayerData';
import PlayerDetailModal from './PlayerDetailModal';

interface ShortlistItem {
  id: string;
  notes: string;
  created_at: string;
  priority_level?: 'high' | 'medium' | 'low';
  player: {
    id: string;
    full_name: string;
    position: string;
    age: number;
    photo_url?: string;
    headshot_url?: string;
    market_value?: number;
    citizenship: string;
    date_of_birth: string;
  };
  pitch: {
    id: string;
    expires_at: string;
    asking_price?: number;
    currency: string;
    transfer_type: string;
    deal_stage: string;
    view_count: number;
    message_count: number;
    shortlist_count: number;
    team: {
      id: string;
      team_name: string;
      country: string;
      logo_url?: string;
    };
    tagged_videos?: string[];
  };
}

interface ShortlistStats {
  totalPlayers: number;
  expiringThisWeek: number;
  averagePrice: number;
  topPosition: string;
  recentActivity: number;
}

const AgentShortlistEnhanced = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [shortlistItems, setShortlistItems] = useState<ShortlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTransferType, setFilterTransferType] = useState('');
  const [filterExpiring, setFilterExpiring] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [stats, setStats] = useState<ShortlistStats>({
    totalPlayers: 0,
    expiringThisWeek: 0,
    averagePrice: 0,
    topPosition: '',
    recentActivity: 0
  });

  // Get player data for modal
  const { player: modalPlayer, loading: playerLoading } = usePlayerData(selectedPlayer);

  useEffect(() => {
    fetchShortlist();
  }, [profile]);

  useEffect(() => {
    filterShortlist();
    calculateStats();
  }, [shortlistItems, searchTerm, filterPosition, filterPriority, filterTransferType, filterExpiring, sortBy]);

  const fetchShortlist = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      const { data, error } = await supabase
        .from('shortlist')
        .select(`
          *,
          player:players!inner(
            id,
            full_name,
            position,
            date_of_birth,
            photo_url,
            headshot_url,
            market_value,
            citizenship
          ),
          pitch:transfer_pitches!inner(
            id,
            expires_at,
            asking_price,
            currency,
            transfer_type,
            deal_stage,
            view_count,
            message_count,
            shortlist_count,
            tagged_videos,
            team:teams!inner(
              id,
              team_name,
              country,
              logo_url
            )
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to calculate age and handle tagged_videos
      const processedData: ShortlistItem[] = (data || []).map(item => ({
        ...item,
        player: {
          ...item.player,
          age: item.player.date_of_birth
            ? new Date().getFullYear() - new Date(item.player.date_of_birth).getFullYear()
            : 0
        },
        priority_level: (item.priority_level as 'high' | 'medium' | 'low') || 'medium',
        pitch: {
          ...item.pitch,
          tagged_videos: Array.isArray(item.pitch.tagged_videos)
            ? item.pitch.tagged_videos.map(video => String(video))
            : item.pitch.tagged_videos
              ? [String(item.pitch.tagged_videos)]
              : []
        }
      }));

      setShortlistItems(processedData);
      console.log(`Loaded ${processedData.length} shortlisted players`);
    } catch (error) {
      console.error('Error fetching shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to load shortlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterShortlist = () => {
    let filtered = [...shortlistItems];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pitch.team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPosition && filterPosition !== 'all') {
      filtered = filtered.filter(item =>
        item.player.position.toLowerCase().includes(filterPosition.toLowerCase())
      );
    }

    if (filterPriority && filterPriority !== 'all') {
      filtered = filtered.filter(item =>
        item.priority_level === filterPriority
      );
    }

    if (filterTransferType && filterTransferType !== 'all') {
      filtered = filtered.filter(item =>
        item.pitch.transfer_type === filterTransferType
      );
    }

    if (filterExpiring && filterExpiring !== 'all') {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (filterExpiring === 'expiring_soon') {
        filtered = filtered.filter(item =>
          new Date(item.pitch.expires_at) <= sevenDaysFromNow &&
          new Date(item.pitch.expires_at) > now
        );
      } else if (filterExpiring === 'expired') {
        filtered = filtered.filter(item =>
          new Date(item.pitch.expires_at) <= now
        );
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'name_asc':
        filtered.sort((a, b) => a.player.full_name.localeCompare(b.player.full_name));
        break;
      case 'expires_asc':
        filtered.sort((a, b) => new Date(a.pitch.expires_at).getTime() - new Date(b.pitch.expires_at).getTime());
        break;
      case 'priority_desc':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => priorityOrder[b.priority_level || 'medium'] - priorityOrder[a.priority_level || 'medium']);
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.pitch.asking_price || 0) - (a.pitch.asking_price || 0));
        break;
      default: // created_at_desc
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredItems(filtered);
  };

  const calculateStats = () => {
    if (shortlistItems.length === 0) return;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringThisWeek = shortlistItems.filter(item => {
      const expiryDate = new Date(item.pitch.expires_at);
      return expiryDate <= sevenDaysFromNow && expiryDate > now;
    }).length;

    const validPrices = shortlistItems
      .filter(item => item.pitch.asking_price)
      .map(item => item.pitch.asking_price!);

    const averagePrice = validPrices.length > 0
      ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
      : 0;

    const positionCounts: Record<string, number> = {};
    shortlistItems.forEach(item => {
      positionCounts[item.player.position] = (positionCounts[item.player.position] || 0) + 1;
    });

    const topPosition = Object.entries(positionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    const recentActivity = shortlistItems.filter(item => {
      const createdDate = new Date(item.created_at);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      return createdDate >= threeDaysAgo;
    }).length;

    setStats({
      totalPlayers: shortlistItems.length,
      expiringThisWeek,
      averagePrice,
      topPosition,
      recentActivity
    });
  };

  const updatePriority = async (shortlistId: string, priority: 'high' | 'medium' | 'low') => {
    try {
      const { error } = await supabase
        .from('shortlist')
        .update({ priority_level: priority })
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.map(item =>
        item.id === shortlistId ? { ...item, priority_level: priority } : item
      ));

      toast({
        title: "Priority Updated",
        description: "Player priority level has been updated",
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      });
    }
  };

  const updateNotes = async (shortlistId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('shortlist')
        .update({ notes })
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.map(item =>
        item.id === shortlistId ? { ...item, notes } : item
      ));

      toast({
        title: "Notes Updated",
        description: "Player notes have been saved",
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      });
    }
  };

  const removeFromShortlist = async (shortlistId: string) => {
    if (!confirm('Remove this player from your shortlist?')) return;

    try {
      const { error } = await supabase
        .from('shortlist')
        .delete()
        .eq('id', shortlistId);

      if (error) throw error;

      setShortlistItems(prev => prev.filter(item => item.id !== shortlistId));

      toast({
        title: "Removed",
        description: "Player removed from shortlist",
      });
    } catch (error) {
      console.error('Error removing from shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from shortlist",
        variant: "destructive"
      });
    }
  };

  const viewPlayerVideos = async (playerId: string) => {
    try {
      const { data: videos } = await supabase
        .from('videos')
        .select('*')
        .contains('tagged_players', [playerId])
        .limit(1);

      if (videos && videos.length > 0) {
        setSelectedVideo(videos[0]);
        setShowVideoAnalysis(true);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const exportShortlist = () => {
    const exportData = filteredItems.map(item => ({
      playerName: item.player.full_name,
      position: item.player.position,
      age: item.player.age,
      nationality: item.player.citizenship,
      team: item.pitch.team.team_name,
      country: item.pitch.team.country,
      transferType: item.pitch.transfer_type,
      askingPrice: item.pitch.asking_price,
      currency: item.pitch.currency,
      expiresAt: item.pitch.expires_at,
      priority: item.priority_level,
      notes: item.notes,
      shortlistedAt: item.created_at
    }));

    const csvContent = "data:text/csv;charset=utf-8," +
      Object.keys(exportData[0]).join(",") + "\n" +
      exportData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shortlist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exported",
      description: "Shortlist exported successfully",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow && expiryDate > new Date();
  };

  if (showVideoAnalysis && selectedVideo) {
    return (
      <EnhancedVideoAnalysis
        videoId={selectedVideo.id}
        teamId={selectedVideo.team_id}
        onAnalysisComplete={() => {
          setShowVideoAnalysis(false);
          setSelectedVideo(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-bright-pink flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-white truncate">{stats.totalPlayers}</p>
                <p className="text-xs sm:text-sm text-gray-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-white">{stats.expiringThisWeek}</p>
                <p className="text-xs sm:text-sm text-gray-400">Expiring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 col-span-2 sm:col-span-1">
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm lg:text-lg font-bold text-white truncate">
                  {stats.averagePrice > 0 ? formatCurrency(stats.averagePrice, 'USD') : 'N/A'}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">Avg. Price</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hidden sm:block">
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm sm:text-lg lg:text-lg font-bold text-white truncate">{stats.topPosition || 'N/A'}</p>
                <p className="text-xs sm:text-sm text-gray-400">Top Pos.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hidden lg:block">
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-white">{stats.recentActivity}</p>
                <p className="text-xs sm:text-sm text-gray-400">Recent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-bright-pink" />
            Enhanced Shortlist
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredItems.length} of {shortlistItems.length} player{filteredItems.length !== 1 ? 's' : ''} shortlisted
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportShortlist}
            disabled={filteredItems.length === 0}
            className="text-xs sm:text-sm"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                placeholder="Search players, teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-9 bg-gray-700 border-gray-600 text-xs sm:text-sm h-8 sm:h-10"
              />
            </div>

            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="forward">Forward</SelectItem>
                <SelectItem value="midfielder">Midfielder</SelectItem>
                <SelectItem value="defender">Defender</SelectItem>
                <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTransferType} onValueChange={setFilterTransferType}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterExpiring} onValueChange={setFilterExpiring}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Recent</SelectItem>
                <SelectItem value="expires_asc">Expiring</SelectItem>
                <SelectItem value="priority_desc">Priority</SelectItem>
                <SelectItem value="price_desc">Price</SelectItem>
                <SelectItem value="name_asc">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shortlist Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-gray-800">
              <CardContent className="p-3 sm:p-4">
                <div className="h-32 bg-gray-700 rounded mb-3"></div>
                <div className="h-3 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 sm:p-12 text-center">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              {shortlistItems.length === 0 ? 'No Players Shortlisted' : 'No Players Match Filters'}
            </h3>
            <p className="text-sm text-gray-400">
              {shortlistItems.length === 0
                ? "Start exploring the transfer timeline to shortlist players you're interested in."
                : "Try adjusting your search filters to find more players."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`border-gray-600 hover:border-rosegold/50 transition-colors ${isExpired(item.pitch.expires_at) ? 'opacity-60' : ''
                }`}
            >
              <CardContent className="p-0">
                {/* Player Header */}
                <div className="relative">
                  <div className="h-24 sm:h-28 lg:h-32 bg-gradient-to-br from-gray-800 to-gray-900 p-2 sm:p-3 lg:p-4 flex items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden bg-gray-700 mr-2 sm:mr-3 lg:mr-4 flex-shrink-0">
                      {item.player.photo_url || item.player.headshot_url ? (
                        <img
                          src={item.player.photo_url || item.player.headshot_url}
                          alt={item.player.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg line-clamp-1">
                        {item.player.full_name}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {item.player.position} • Age {item.player.age}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-400 text-xs">{item.player.citizenship}</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <div className="absolute top-2 right-2">
                    <Select
                      value={item.priority_level}
                      onValueChange={(value) => updatePriority(item.id, value as any)}
                    >
                      <SelectTrigger className="w-auto h-auto p-1 border-0 bg-transparent">
                        <Badge className={`${getPriorityColor(item.priority_level || 'medium')} text-white text-xs`}>
                          <Star className="w-3 h-3 mr-1" />
                          {(item.priority_level || 'medium').toUpperCase()}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {isExpired(item.pitch.expires_at) ? (
                      <Badge variant="destructive" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Expired
                      </Badge>
                    ) : isExpiringSoon(item.pitch.expires_at) && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Team & Transfer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{item.pitch.team.team_name}, {item.pitch.team.country}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant={item.pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}
                      >
                        {item.pitch.transfer_type.toUpperCase()}
                      </Badge>

                      {!isExpired(item.pitch.expires_at) && (
                        <div className="text-xs text-gray-400">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDistanceToNow(new Date(item.pitch.expires_at))} left
                        </div>
                      )}
                    </div>

                    {item.pitch.asking_price && (
                      <div className="flex items-center gap-1 text-bright-pink font-bold">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(item.pitch.asking_price, item.pitch.currency)}
                      </div>
                    )}

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.pitch.view_count || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {item.pitch.message_count || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {item.pitch.shortlist_count || 0}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Textarea
                      placeholder="Add your notes about this player..."
                      value={item.notes || ''}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      className="bg-gray-800 border-gray-600 text-xs min-h-16 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                      onClick={() => setSelectedPlayer(item.player.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-xs"
                      onClick={() => viewPlayerVideos(item.player.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Videos
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-xs"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => removeFromShortlist(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && modalPlayer && (
        <PlayerDetailModal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          player={{
            age: modalPlayer.age || 0,
            ai_analysis: modalPlayer.ai_analysis || null,
            bio: modalPlayer.bio || '',
            citizenship: modalPlayer.citizenship || '',
            contract_expires: modalPlayer.contract_expires || '',
            created_at: new Date().toISOString(),
            current_club: modalPlayer.current_club || '',
            date_of_birth: modalPlayer.date_of_birth || '',
            fifa_id: modalPlayer.fifa_id || '',
            foot: modalPlayer.foot || '',
            full_name: modalPlayer.full_name,
            full_body_url: modalPlayer.full_body_url || null,
            gender: (modalPlayer.gender as "male" | "female" | "other") || 'male',
            headshot_url: modalPlayer.headshot_url || '',
            height: typeof modalPlayer.height === 'string' ? parseFloat(modalPlayer.height) || 0 : modalPlayer.height || 0,
            id: modalPlayer.id,
            international_duty: modalPlayer.international_duty || null,
            jersey_number: modalPlayer.jersey_number || 0,
            joined_date: modalPlayer.joined_date || '',
            leagues_participated: modalPlayer.leagues_participated || [],
            market_value: modalPlayer.market_value || 0,
            match_stats: modalPlayer.match_stats || null,
            photo_url: modalPlayer.photo_url || '',
            place_of_birth: modalPlayer.place_of_birth || '',
            player_agent: modalPlayer.player_agent || '',
            portrait_url: modalPlayer.portrait_url || '',
            position: modalPlayer.position || '',
            team_id: '',
            titles_seasons: modalPlayer.titles_seasons || [],
            transfer_history: modalPlayer.transfer_history || null,
            updated_at: new Date().toISOString(),
            weight: typeof modalPlayer.weight === 'string' ? parseFloat(modalPlayer.weight) || 0 : modalPlayer.weight || 0
          }}
        />
      )}
    </div>
  );
};

export default AgentShortlistEnhanced;
