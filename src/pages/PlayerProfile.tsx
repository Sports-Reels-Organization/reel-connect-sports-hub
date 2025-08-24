
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import PlayerDetailModal from '@/components/PlayerDetailModal';
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

        {/* Player Details - using the existing PlayerDetailModal component but as page content */}
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg">
          <PlayerDetailModal
            player={player}
            isOpen={true}
            onClose={() => {}} // No close needed for page view
            onEdit={handleEdit}
          />
        </div>
      </div>
    </Layout>
  );
};

export default PlayerProfile;
