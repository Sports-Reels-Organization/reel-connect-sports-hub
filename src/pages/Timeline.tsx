
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Clock, Calendar, User, Building, MapPin, Trophy, MessageSquare, 
  Send, Heart, Share2, Eye, TrendingUp, Users, Star, Activity,
  ChevronDown, ChevronUp, Filter, Search, Bell
} from 'lucide-react';
import PlayerProfileWrapper from '@/components/PlayerProfileWrapper';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';

interface Post {
  id: string;
  created_at: string;
  content: string;
  likes: number;
  shares: number;
  views: number;
  author_id: string;
  author_name: string;
  author_avatar: string;
  comments: Comment[];
  tagged_players: any;
}

interface Comment {
  id: string;
  created_at: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
}

interface Team {
  id: string;
  team_name: string;
  logo_url: string;
  country: string;
  sport_type: string;
}

// Extended Profile interface to include avatar_url
interface ExtendedProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: 'agent' | 'team';
  profile_completed?: boolean;
  country?: string;
  phone?: string;
  country_code?: string;
  is_verified?: boolean;
  avatar_url?: string;
}

const initialPosts: Post[] = [
  {
    id: '1',
    created_at: '2024-01-26T12:00:00Z',
    content: 'Excited to announce our new partnership with Adidas! ⚽️ #Adidas #Partnership #Football',
    likes: 120,
    shares: 30,
    views: 500,
    author_id: 'team1',
    author_name: 'Real Madrid CF',
    author_avatar: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    comments: [
      {
        id: 'c1',
        created_at: '2024-01-26T12:15:00Z',
        content: 'Great news!',
        author_id: 'user1',
        author_name: 'Fan1',
        author_avatar: 'https://i.pravatar.cc/50?img=1'
      }
    ],
    tagged_players: [
      {
        id: 'player1',
        full_name: 'Vinicius Jr.'
      }
    ]
  },
  {
    id: '2',
    created_at: '2024-01-25T18:00:00Z',
    content: 'Training hard for the upcoming match! 💪 #Training #Football #HardWork',
    likes: 150,
    shares: 45,
    views: 620,
    author_id: 'team2',
    author_name: 'Manchester United',
    author_avatar: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    comments: [
      {
        id: 'c2',
        created_at: '2024-01-25T18:30:00Z',
        content: 'Looking forward to the game!',
        author_id: 'user2',
        author_name: 'Fan2',
        author_avatar: 'https://i.pravatar.cc/50?img=2'
      }
    ],
    tagged_players: [
      {
        id: 'player2',
        full_name: 'Marcus Rashford'
      }
    ]
  },
  {
    id: '3',
    created_at: '2024-01-24T20:00:00Z',
    content: 'Happy to score the winning goal! ⚽️ #Goal #Victory #Football',
    likes: 200,
    shares: 60,
    views: 750,
    author_id: 'player3',
    author_name: 'Cristiano Ronaldo',
    author_avatar: 'https://i.pravatar.cc/50?img=3',
    comments: [
      {
        id: 'c3',
        created_at: '2024-01-24T20:15:00Z',
        content: 'You are the best!',
        author_id: 'user3',
        author_name: 'Fan3',
        author_avatar: 'https://i.pravatar.cc/50?img=4'
      }
    ],
    tagged_players: []
  },
  {
    id: '4',
    created_at: '2024-01-23T15:00:00Z',
    content: 'Great team effort today! 🤝 #TeamWork #Football #Victory',
    likes: 180,
    shares: 50,
    views: 700,
    author_id: 'team3',
    author_name: 'FC Barcelona',
    author_avatar: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    comments: [
      {
        id: 'c4',
        created_at: '2024-01-23T15:30:00Z',
        content: 'Visca Barca!',
        author_id: 'user4',
        author_name: 'Fan4',
        author_avatar: 'https://i.pravatar.cc/50?img=5'
      }
    ],
    tagged_players: [
      {
        id: 'player4',
        full_name: 'Lionel Messi'
      }
    ]
  },
  {
    id: '5',
    created_at: '2024-01-22T10:00:00Z',
    content: 'Enjoying the off-season! ☀️ #OffSeason #Vacation #Relax',
    likes: 100,
    shares: 25,
    views: 450,
    author_id: 'player5',
    author_name: 'Neymar Jr.',
    author_avatar: 'https://i.pravatar.cc/50?img=6',
    comments: [
      {
        id: 'c5',
        created_at: '2024-01-22T10:15:00Z',
        content: 'Have a great time!',
        author_id: 'user5',
        author_name: 'Fan5',
        author_avatar: 'https://i.pravatar.cc/50?img=7'
      }
    ],
    tagged_players: []
  }
];

const Timeline = () => {
  const { profile } = useAuth();
  const extendedProfile = profile as ExtendedProfile;
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPost, setNewPost] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterTerm, setFilterTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', message: 'New message from Leo Messi', read: false },
    { id: 'n2', message: 'Your post has 100 likes!', read: false },
    { id: 'n3', message: 'Welcome to the platform!', read: true },
  ]);

  const {
    selectedPlayerId,
    selectedPlayerName,
    isModalOpen: isPlayerModalOpen,
    openPlayerProfile,
    closePlayerProfile
  } = usePlayerProfile();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .limit(5);

      if (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: "Error",
          description: "Failed to fetch teams",
          variant: "destructive"
        });
      }

      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = () => {
    if (newPost.trim() === '') return;

    const newPostItem: Post = {
      id: String(Date.now()),
      created_at: new Date().toISOString(),
      content: newPost,
      likes: 0,
      shares: 0,
      views: 0,
      author_id: extendedProfile?.id || 'userX',
      author_name: extendedProfile?.full_name || 'Anonymous',
      author_avatar: extendedProfile?.avatar_url || 'https://i.pravatar.cc/50?img=8',
      comments: [],
      tagged_players: []
    };

    setPosts([newPostItem, ...posts]);
    setNewPost('');

    toast({
      title: "Success",
      description: "Post submitted successfully",
    });
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleShare = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, shares: post.shares + 1 } : post
    ));
  };

  const handleAddComment = (postId: string, commentContent: string) => {
    if (commentContent.trim() === '') return;

    const newComment: Comment = {
      id: String(Date.now()),
      created_at: new Date().toISOString(),
      content: commentContent,
      author_id: extendedProfile?.id || 'userX',
      author_name: extendedProfile?.full_name || 'Anonymous',
      author_avatar: extendedProfile?.avatar_url || 'https://i.pravatar.cc/50?img=8',
    };

    setPosts(posts.map(post =>
      post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
    ));
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const filteredPosts = sortedPosts.filter(post =>
    post.content.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const teamFilteredPosts = selectedTeam
    ? filteredPosts.filter(post => post.author_id === selectedTeam)
    : filteredPosts;

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handlePlayerTagClick = async (playerName: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name')
        .ilike('full_name', `%${playerName.trim()}%`)
        .limit(1);

      if (error) {
        console.error('Error finding player:', error);
        return;
      }

      if (data && data.length > 0) {
        openPlayerProfile(data[0].id, data[0].full_name);
      } else {
        console.log('Player not found:', playerName);
      }
    } catch (error) {
      console.error('Error in handlePlayerTagClick:', error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white font-polysans">
            Timeline
          </h1>

          {/* Notifications */}
          <div className="relative">
            <Button
              onClick={() => setShowNotifications(!showNotifications)}
              variant="ghost"
              className="relative hover:bg-gray-700 text-gray-400"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                <div className="py-2 px-4 text-sm text-gray-300 border-b border-gray-700">
                  Notifications
                </div>
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`py-2 px-4 text-sm ${notification.read ? 'text-gray-500' : 'text-white'} hover:bg-gray-700 cursor-pointer`}
                    >
                      {notification.message}
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-4 text-sm text-gray-500">
                    No notifications
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Creation Section */}
        <Card className="bg-gray-800 border border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={extendedProfile?.avatar_url || 'https://i.pravatar.cc/50?img=8'}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <div className="text-white font-semibold">{extendedProfile?.full_name || 'Anonymous'}</div>
            </div>
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-gray-700 text-white border-gray-600 resize-none"
            />
            <div className="text-right mt-2">
              <Button onClick={handlePostSubmit} className="bg-rosegold hover:bg-rosegold/90 text-white">
                Post
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Sorting */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>

          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none"
            />
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-800 border border-gray-700 rounded-md p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort Order</label>
                <Button variant="outline" onClick={toggleSortOrder} className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full">
                  {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Team</label>
                <select
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value === '' ? null : e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.team_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Posts */}
        {loading ? (
          <div className="text-center text-gray-500">Loading posts...</div>
        ) : teamFilteredPosts.length > 0 ? (
          teamFilteredPosts.map(post => (
            <Card key={post.id} className="bg-gray-800 border border-gray-700 mb-4">
              <CardContent className="p-4">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.author_avatar}
                      alt="Author"
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="text-white font-semibold">{post.author_name}</div>
                      <div className="text-gray-500 text-sm">{formatDate(post.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <Eye className="inline-block w-4 h-4 mr-1" /> {post.views}
                  </div>
                </div>

                {/* Post Content */}
                <div className="text-gray-300 mb-4">{post.content}</div>

                {/* Tagged Players */}
                {post.tagged_players && post.tagged_players.length > 0 && (
                  <div className="mb-3">
                    <div className="text-gray-400 text-sm mb-1">Tagged Players:</div>
                    <div className="flex flex-wrap gap-2">
                      {post.tagged_players.map((player: any) => (
                        <Badge
                          key={player.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-rosegold hover:text-black transition-all duration-200 text-xs bg-rosegold/20 text-rosegold border-rosegold/30"
                          onClick={() => handlePlayerTagClick(player.full_name)}
                        >
                          {player.full_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between text-gray-400 text-sm">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => handleLike(post.id)} className="hover:bg-gray-700">
                      <Heart className="w-4 h-4 mr-1" /> Like ({post.likes})
                    </Button>
                    <Button variant="ghost" onClick={() => handleShare(post.id)} className="hover:bg-gray-700">
                      <Share2 className="w-4 h-4 mr-1" /> Share ({post.shares})
                    </Button>
                  </div>
                  <Button variant="ghost" className="hover:bg-gray-700">
                    <MessageSquare className="w-4 h-4 mr-1" /> Comment ({post.comments.length})
                  </Button>
                </div>

                {/* Comments Section */}
                <div className="mt-4">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-2 py-2 border-t border-gray-700">
                      <img
                        src={comment.author_avatar}
                        alt="Comment Author"
                        className="w-6 h-6 rounded-full"
                      />
                      <div>
                        <div className="text-gray-300 font-semibold">{comment.author_name}</div>
                        <div className="text-gray-500 text-xs">{formatDate(comment.created_at)}</div>
                        <div className="text-gray-400">{comment.content}</div>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="flex items-center space-x-2 mt-3">
                    <img
                      src={extendedProfile?.avatar_url || 'https://i.pravatar.cc/50?img=8'}
                      alt="Your Avatar"
                      className="w-6 h-6 rounded-full"
                    />
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          handleAddComment(post.id, target.value);
                          target.value = ''; // Clear the input after submitting
                        }
                      }}
                      className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-1 text-sm w-full focus:outline-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-gray-500">No posts available.</div>
        )}

        {/* Player Profile Modal */}
        <PlayerProfileWrapper
          isOpen={isPlayerModalOpen}
          onClose={closePlayerProfile}
          playerId={selectedPlayerId || ''}
          playerName={selectedPlayerName || ''}
        />
      </div>
    </Layout>
  );
};

export default Timeline;
