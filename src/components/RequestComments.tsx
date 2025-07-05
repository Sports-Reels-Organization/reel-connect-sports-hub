
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlayerTagging } from './PlayerTagging';

interface Comment {
  id: string;
  content: string;
  tagged_players: string[];
  created_at: string;
  profiles: {
    full_name: string;
    user_type: string;
  };
  agents?: {
    agency_name: string;
  };
  teams?: {
    team_name: string;
  };
}

interface TaggedPlayer {
  id: string;
  player_name: string;
  player_position: string;
  team_name: string;
  asking_price: number;
  currency: string;
}

interface RequestCommentsProps {
  requestId: string;
  isPublic: boolean;
}

export const RequestComments: React.FC<RequestCommentsProps> = ({
  requestId,
  isPublic
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const [commentTaggedPlayers, setCommentTaggedPlayers] = useState<{ [commentId: string]: TaggedPlayer[] }>({});

  useEffect(() => {
    if (isPublic) {
      fetchComments();
    }
  }, [requestId, isPublic]);

  useEffect(() => {
    if (comments.length > 0) {
      fetchCommentTaggedPlayers();
    }
  }, [comments]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_request_comments')
        .select(`
          id,
          content,
          tagged_players,
          created_at,
          profiles!inner(
            full_name,
            user_type
          ),
          agents(
            agency_name
          ),
          teams(
            team_name
          )
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchCommentTaggedPlayers = async () => {
    try {
      // Get all unique player IDs from all comments
      const allPlayerIds = new Set<string>();
      comments.forEach(comment => {
        if (comment.tagged_players && Array.isArray(comment.tagged_players)) {
          comment.tagged_players.forEach(playerId => allPlayerIds.add(playerId));
        }
      });

      if (allPlayerIds.size === 0) {
        setCommentTaggedPlayers({});
        return;
      }

      const playerIdsArray = Array.from(allPlayerIds);

      // Fetch player details for all tagged players
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          player_id,
          asking_price,
          currency,
          players!inner(
            full_name,
            position
          ),
          teams!inner(
            team_name
          )
        `)
        .in('player_id', playerIdsArray)
        .eq('status', 'active');

      if (error) throw error;

      // Create a map of player details
      const playerMap = new Map();
      (data || []).forEach((pitch: any) => {
        playerMap.set(pitch.player_id, {
          id: pitch.player_id,
          player_name: pitch.players?.full_name || '',
          player_position: pitch.players?.position || '',
          team_name: pitch.teams?.team_name || '',
          asking_price: pitch.asking_price || 0,
          currency: pitch.currency || 'USD'
        });
      });

      // Create a map of comment ID to tagged players
      const commentTaggedMap: { [commentId: string]: TaggedPlayer[] } = {};
      comments.forEach(comment => {
        if (comment.tagged_players && Array.isArray(comment.tagged_players)) {
          commentTaggedMap[comment.id] = comment.tagged_players
            .map(playerId => playerMap.get(playerId))
            .filter(Boolean);
        }
      });

      setCommentTaggedPlayers(commentTaggedMap);
    } catch (error) {
      console.error('Error fetching comment tagged players:', error);
    }
  };

  const submitComment = async () => {
    if (!profile || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agent_request_comments')
        .insert({
          request_id: requestId,
          profile_id: profile.id,
          content: newComment,
          tagged_players: taggedPlayers
        });

      if (error) throw error;

      setNewComment('');
      setTaggedPlayers([]);
      fetchComments();
      
      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isPublic) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-rosegold" />
        <h3 className="text-lg font-semibold text-white">Comments ({comments.length})</h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <Card key={comment.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-white">
                    {comment.agents?.agency_name || comment.teams?.team_name || comment.profiles.full_name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {comment.profiles.user_type}
                  </Badge>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(comment.created_at))} ago
                </span>
              </div>
              
              <p className="text-gray-300 mb-3">{comment.content}</p>
              
              {/* Tagged Players in Comment */}
              {commentTaggedPlayers[comment.id] && commentTaggedPlayers[comment.id].length > 0 && (
                <div className="border-t border-gray-600 pt-3">
                  <p className="text-sm text-gray-400 mb-2">Tagged Players:</p>
                  <div className="grid gap-2">
                    {commentTaggedPlayers[comment.id].map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div>
                          <p className="text-sm font-medium text-white">{player.player_name}</p>
                          <p className="text-xs text-gray-400">{player.player_position} • {player.team_name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {player.asking_price?.toLocaleString()} {player.currency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Comment Form - Only for authenticated users */}
      {profile && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              {/* Player Tagging Component */}
              <PlayerTagging
                selectedPlayers={taggedPlayers}
                onPlayersChange={setTaggedPlayers}
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={submitComment}
                  disabled={loading || !newComment.trim()}
                  className="bg-rosegold hover:bg-rosegold/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequestComments;
