import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Trophy, 
  ArrowUpDown, 
  Users, 
  Megaphone,
  Zap,
  Heart, 
  MessageCircle, 
  Pin, 
  Plus,
  Filter,
  Download,
  Share2,
  ExternalLink,
  Target,
  Award,
  Activity,
  Clock,
  User,
  Building2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type EventType = 'match' | 'transfer' | 'player' | 'team' | 'achievement';

interface TimelineEvent {
  id: string;
  team_id: string;
  event_type: EventType;
  title: string;
  description: string;
  event_date: string;
  created_at: string;
  metadata?: any;
  is_pinned: boolean;
  player_id?: string;
  match_id?: string;
  created_by: string;
  reactions_count: number;
  comments_count: number;
  player?: {
    id: string;
    full_name: string;
    photo_url?: string;
  };
}

interface TimelineComment {
  id: string;
  event_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profile: {
    full_name: string;
    user_type: string;
  };
}

const EventIcon = ({ type }: { type: EventType }) => {
  const iconMap = {
    match: <Zap className="w-5 h-5 text-green-500" />,
    transfer: <ArrowUpDown className="w-5 h-5 text-blue-500" />,
    player: <Users className="w-5 h-5 text-purple-500" />,
    team: <Megaphone className="w-5 h-5 text-orange-500" />,
    achievement: <Trophy className="w-5 h-5 text-yellow-500" />
  };
  
  return iconMap[type] || <Activity className="w-5 h-5 text-gray-500" />;
};

const EventBadge = ({ type }: { type: EventType }) => {
  const badgeMap = {
    match: { label: 'Match', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    transfer: { label: 'Transfer', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    player: { label: 'Player', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    team: { label: 'Team', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    achievement: { label: 'Achievement', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
  };
  
  const badge = badgeMap[type] || { label: 'Event', className: 'bg-gray-500/10 text-gray-400' };
  
  return (
    <Badge variant="outline" className={badge.className}>
      {badge.label}
    </Badge>
  );
};

const EnhancedTeamTimeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New event form
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventType, setNewEventType] = useState<EventType>('team');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventPlayerId, setNewEventPlayerId] = useState('');
  
  // Comments
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [comments, setComments] = useState<TimelineComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  // Players for filtering/selection
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.user_type === 'team') {
      fetchTimelineEvents();
      fetchTeamPlayers();
    }
  }, [profile]);

  useEffect(() => {
    filterEvents();
  }, [events, activeTab, dateFilter, selectedPlayer, searchTerm]);

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('timeline_events')
        .select(`
          *,
          players (
            id,
            full_name,
            photo_url
          )
        `)
        .eq('team_id', profile?.id)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      toast({
        title: "Error",
        description: "Failed to load timeline events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, photo_url')
        .eq('team_id', profile?.id)
        .order('full_name');

      if (error) throw error;
      setTeamPlayers(data || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by tab/event type
    if (activeTab !== 'all') {
      filtered = filtered.filter(event => event.event_type === activeTab);
    }

    // Filter by date range
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'season':
          filterDate.setMonth(now.getMonth() - 12);
          break;
      }
      
      filtered = filtered.filter(event => 
        new Date(event.event_date) >= filterDate
      );
    }

    // Filter by player
    if (selectedPlayer !== 'all') {
      filtered = filtered.filter(event => 
        event.player_id === selectedPlayer
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort: pinned events first, then by date
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });

    setFilteredEvents(filtered);
  };

  const createEvent = async () => {
    if (!newEventTitle.trim() || !newEventDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('timeline_events')
        .insert({
          team_id: profile?.id,
          event_type: newEventType,
          title: newEventTitle,
          description: newEventDescription,
          event_date: newEventDate,
          player_id: newEventPlayerId || null,
          created_by: profile?.id,
          is_pinned: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully"
      });

      // Reset form
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventType('team');
      setNewEventPlayerId('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setShowCreateEvent(false);

      // Refresh events
      fetchTimelineEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    }
  };

  const togglePin = async (eventId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('timeline_events')
        .update({ is_pinned: !currentPinned })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(event =>
        event.id === eventId ? { ...event, is_pinned: !currentPinned } : event
      ));

      toast({
        title: "Success",
        description: currentPinned ? "Event unpinned" : "Event pinned"
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    }
  };

  const fetchComments = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('timeline_comments')
        .select(`
          *,
          profiles (
            full_name,
            user_type
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedEventId) return;

    try {
      const { error } = await supabase
        .from('timeline_comments')
        .insert({
          event_id: selectedEventId,
          profile_id: profile?.id,
          content: newComment
        });

      if (error) throw error;

      setNewComment('');
      fetchComments(selectedEventId);
      
      toast({
        title: "Success",
        description: "Comment added"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const openComments = (eventId: string) => {
    setSelectedEventId(eventId);
    fetchComments(eventId);
    setShowComments(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rosegold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-polysans">Team Timeline</h1>
          <p className="text-gray-400 font-poppins">Complete history of your team's journey</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
            <DialogTrigger asChild>
              <Button className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Event</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Add a new event to your team timeline
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={newEventType} onValueChange={(value: EventType) => setNewEventType(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="match">Match Event</SelectItem>
                    <SelectItem value="transfer">Transfer Event</SelectItem>
                    <SelectItem value="player">Player Event</SelectItem>
                    <SelectItem value="team">Team Update</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Event title"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />

                <Textarea
                  placeholder="Event description"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />

                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />

                {(newEventType === 'player' || newEventType === 'transfer') && (
                  <Select value={newEventPlayerId} onValueChange={setNewEventPlayerId}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select player (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {teamPlayers.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateEvent(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createEvent}
                    className="bg-rosegold hover:bg-rosegold/90 text-white"
                  >
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs bg-gray-700 border-gray-600 text-white"
            />
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="season">This Season</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Players</SelectItem>
                {teamPlayers.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="ml-auto">
              {filteredEvents.length} events
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
            All Events
          </TabsTrigger>
          <TabsTrigger value="match" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
            Matches
          </TabsTrigger>
          <TabsTrigger value="transfer" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
            Transfers
          </TabsTrigger>
          <TabsTrigger value="player" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
            Players
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
            Announcements
          </TabsTrigger>
          <TabsTrigger value="achievement" className="data-[state=active]:bg-rosegold data-[state=active]:text-white">
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredEvents.length === 0 ? (
            <Card className="border-gray-700">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                <p className="text-gray-400 mb-6">
                  {activeTab === 'all' 
                    ? "Start adding events to build your team's timeline"
                    : `No ${activeTab} events found with current filters`
                  }
                </p>
                <Button
                  onClick={() => setShowCreateEvent(true)}
                  className="bg-rosegold hover:bg-rosegold/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="border-gray-700 hover:border-rosegold/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon and Pin */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-2 bg-gray-800 rounded-full">
                          <EventIcon type={event.event_type} />
                        </div>
                        {event.is_pinned && (
                          <Pin className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                            <EventBadge type={event.event_type} />
                            {event.is_pinned && (
                              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                Pinned
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePin(event.id, event.is_pinned)}
                              className="text-gray-400 hover:text-yellow-500"
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-3">{event.description}</p>

                        {event.player && (
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              Related to: {event.player.full_name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.event_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(event.created_at))} ago
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openComments(event.id)}
                              className="text-gray-400 hover:text-blue-400"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              {event.comments_count || 0}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              {event.reactions_count || 0}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Event Comments</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add notes and comments about this event
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{comment.profile.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {comment.profile.user_type}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at))} ago
                    </span>
                  </div>
                  <p className="text-gray-300">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Button
              onClick={addComment}
              className="bg-rosegold hover:bg-rosegold/90 text-white"
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedTeamTimeline;
