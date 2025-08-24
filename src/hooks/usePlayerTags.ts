
import { useState, useEffect } from 'react';

interface PlayerTag {
  id: string;
  label: string;
  color: string;
  description?: string;
}

interface PlayerTagAssignment {
  playerId: string;
  tags: PlayerTag[];
}

// Predefined system tags
const defaultTags: PlayerTag[] = [
  { id: 'injured', label: 'Injured', color: 'bg-red-500', description: 'Player is currently injured' },
  { id: 'for-sale', label: 'For Sale', color: 'bg-green-500', description: 'Available for transfer' },
  { id: 'loan', label: 'On Loan', color: 'bg-blue-500', description: 'Player is on loan' },
  { id: 'youth', label: 'Youth Prospect', color: 'bg-purple-500', description: 'Young promising player' },
  { id: 'captain', label: 'Captain', color: 'bg-yellow-500', description: 'Team captain' },
  { id: 'key-player', label: 'Key Player', color: 'bg-orange-500', description: 'Important team member' },
  { id: 'retiring', label: 'Retiring', color: 'bg-gray-500', description: 'Planning to retire' },
  { id: 'new-signing', label: 'New Signing', color: 'bg-pink-500', description: 'Recently joined the team' },
];

export const usePlayerTags = () => {
  const [availableTags, setAvailableTags] = useState<PlayerTag[]>(defaultTags);
  const [playerTagAssignments, setPlayerTagAssignments] = useState<PlayerTagAssignment[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedTags = localStorage.getItem('player_tags');
    const storedAssignments = localStorage.getItem('player_tag_assignments');
    
    if (storedTags) {
      try {
        const parsed = JSON.parse(storedTags);
        setAvailableTags([...defaultTags, ...parsed]);
      } catch (error) {
        console.error('Error parsing stored tags:', error);
      }
    }

    if (storedAssignments) {
      try {
        const parsed = JSON.parse(storedAssignments);
        setPlayerTagAssignments(parsed);
      } catch (error) {
        console.error('Error parsing stored assignments:', error);
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    const customTags = availableTags.filter(tag => !defaultTags.find(dt => dt.id === tag.id));
    localStorage.setItem('player_tags', JSON.stringify(customTags));
  }, [availableTags]);

  useEffect(() => {
    localStorage.setItem('player_tag_assignments', JSON.stringify(playerTagAssignments));
  }, [playerTagAssignments]);

  const createTag = (tagData: Omit<PlayerTag, 'id'>) => {
    const newTag: PlayerTag = {
      ...tagData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setAvailableTags(prev => [...prev, newTag]);
    return newTag;
  };

  const deleteTag = (tagId: string) => {
    // Don't allow deleting default tags
    if (defaultTags.find(tag => tag.id === tagId)) {
      return false;
    }

    setAvailableTags(prev => prev.filter(tag => tag.id !== tagId));
    // Remove tag from all players
    setPlayerTagAssignments(prev => 
      prev.map(assignment => ({
        ...assignment,
        tags: assignment.tags.filter(tag => tag.id !== tagId)
      }))
    );
    return true;
  };

  const getPlayerTags = (playerId: string): PlayerTag[] => {
    const assignment = playerTagAssignments.find(a => a.playerId === playerId);
    return assignment?.tags || [];
  };

  const setPlayerTags = (playerId: string, tags: PlayerTag[]) => {
    setPlayerTagAssignments(prev => {
      const existingIndex = prev.findIndex(a => a.playerId === playerId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { playerId, tags };
        return updated;
      } else {
        return [...prev, { playerId, tags }];
      }
    });
  };

  const addTagToPlayer = (playerId: string, tag: PlayerTag) => {
    const currentTags = getPlayerTags(playerId);
    if (!currentTags.find(t => t.id === tag.id)) {
      setPlayerTags(playerId, [...currentTags, tag]);
    }
  };

  const removeTagFromPlayer = (playerId: string, tagId: string) => {
    const currentTags = getPlayerTags(playerId);
    setPlayerTags(playerId, currentTags.filter(t => t.id !== tagId));
  };

  return {
    availableTags,
    playerTagAssignments,
    createTag,
    deleteTag,
    getPlayerTags,
    setPlayerTags,
    addTagToPlayer,
    removeTagFromPlayer
  };
};
