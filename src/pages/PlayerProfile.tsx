
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import PlayerDetailPage from '@/components/PlayerDetailPage';
import { usePlayerData } from '@/hooks/usePlayerData';

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { player, loading, error } = usePlayerData(playerId || null);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    // Navigate to edit page or open edit modal
    console.log('Edit player:', playerId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto"></div>
          <p className="text-gray-400 mt-2 ml-4">Loading player data...</p>
        </div>
      </Layout>
    );
  }

  if (error || !player) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-red-400 mb-4">Error loading player: {error || 'Player not found'}</p>
          <Button onClick={handleBack} className="bg-rosegold text-black hover:bg-rosegold/90">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  // Convert the player data to match the expected DatabasePlayer type
  const databasePlayer = {
    id: player.id,
    full_name: player.full_name,
    position: player.position || '',
    citizenship: player.citizenship || '',
    gender: player.gender as any, // Convert to the expected enum type
    date_of_birth: player.date_of_birth || null,
    height: player.height ? parseInt(player.height) : null,
    weight: player.weight ? parseInt(player.weight) : null,
    jersey_number: player.jersey_number || null,
    market_value: player.market_value || null,
    ai_analysis: player.ai_analysis || null,
    created_at: new Date().toISOString(), // Provide default timestamp
    updated_at: new Date().toISOString(), // Provide default timestamp
    team_id: '', // This will be handled by the component
    joined_date: player.joined_date || null,
    contract_expires: player.contract_expires || null,
    transfer_history: player.transfer_history || null,
    international_duty: player.international_duty || null,
    match_stats: player.match_stats || null,
    age: player.age || null,
    photo_url: player.photo_url || null,
    fifa_id: player.fifa_id || null,
    bio: player.bio || null,
    place_of_birth: player.place_of_birth || null,
    foot: player.foot || null,
    player_agent: player.player_agent || null,
    current_club: player.current_club || null,
    leagues_participated: player.leagues_participated || null,
    titles_seasons: player.titles_seasons || null,
    headshot_url: player.headshot_url || null,
    portrait_url: player.portrait_url || null,
    full_body_url: player.full_body_url || null
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-white hover:text-rosegold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-polysans text-white">Player Profile</h1>
        </div>

        {/* Player Details - using the PlayerDetailPage component */}
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg">
          <PlayerDetailPage
            player={databasePlayer}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </Layout>
  );
};

export default PlayerProfile;
