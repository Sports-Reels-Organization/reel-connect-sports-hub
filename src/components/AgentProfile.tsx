
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { User, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface AgentData {
  id: string;
  agency_name: string;
  fifa_id?: string;
  license_number?: string;
  specialization: string[];
  bio?: string;
  website?: string;
  verified: boolean;
}

const AgentProfile = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    agency_name: '',
    fifa_id: '',
    license_number: '',
    bio: '',
    website: ''
  });

  useEffect(() => {
    fetchAgentData();
  }, [profile]);

  const fetchAgentData = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAgentData(data);
        setFormData({
          agency_name: data.agency_name || '',
          fifa_id: data.fifa_id || '',
          license_number: data.license_number || '',
          bio: data.bio || '',
          website: data.website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agent profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const updateData = {
        agency_name: formData.agency_name,
        fifa_id: formData.fifa_id || null,
        license_number: formData.license_number || null,
        bio: formData.bio || null,
        website: formData.website || null
      };

      if (agentData) {
        const { error } = await supabase
          .from('agents')
          .update(updateData)
          .eq('profile_id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agents')
          .insert({
            profile_id: profile.id,
            ...updateData
          });

        if (error) throw error;
      }

      await fetchAgentData();
      setEditing(false);
      
      toast({
        title: "Success",
        description: "Agent profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating agent profile:', error);
      toast({
        title: "Error",
        description: "Failed to update agent profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canMessagePlayers = () => {
    return agentData?.fifa_id && agentData?.license_number;
  };

  if (loading) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white font-polysans">
          <User className="w-5 h-5" />
          Agent Profile
          {agentData?.verified && (
            <Badge className="bg-green-600 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* FIFA ID Status */}
        <div className="p-4 rounded-lg border border-gray-600 bg-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" />
            <span className="font-medium text-white">FIFA Licensing Status</span>
          </div>
          {canMessagePlayers() ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Licensed - Can message players and offer contracts</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Unlicensed - Can only view and shortlist players</span>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Agency Name *</Label>
              <Input
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter agency name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">FIFA ID (Required for Football)</Label>
              <Input
                value={formData.fifa_id}
                onChange={(e) => setFormData({ ...formData, fifa_id: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter FIFA ID"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">License Number</Label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter license number"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Professional Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Describe your professional experience..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="https://your-website.com"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={loading || !formData.agency_name}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    agency_name: agentData?.agency_name || '',
                    fifa_id: agentData?.fifa_id || '',
                    license_number: agentData?.license_number || '',
                    bio: agentData?.bio || '',
                    website: agentData?.website || ''
                  });
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {agentData ? (
              <>
                <div>
                  <Label className="text-gray-400 text-sm">Agency Name</Label>
                  <p className="text-white font-medium">{agentData.agency_name}</p>
                </div>

                {agentData.fifa_id && (
                  <div>
                    <Label className="text-gray-400 text-sm">FIFA ID</Label>
                    <p className="text-white font-medium">{agentData.fifa_id}</p>
                  </div>
                )}

                {agentData.license_number && (
                  <div>
                    <Label className="text-gray-400 text-sm">License Number</Label>
                    <p className="text-white font-medium">{agentData.license_number}</p>
                  </div>
                )}

                {agentData.bio && (
                  <div>
                    <Label className="text-gray-400 text-sm">Bio</Label>
                    <p className="text-white">{agentData.bio}</p>
                  </div>
                )}

                {agentData.website && (
                  <div>
                    <Label className="text-gray-400 text-sm">Website</Label>
                    <a 
                      href={agentData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-rosegold hover:underline"
                    >
                      {agentData.website}
                    </a>
                  </div>
                )}

                <Button
                  onClick={() => setEditing(true)}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Edit Profile
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Complete your agent profile to access all features</p>
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-rosegold hover:bg-rosegold/90 text-white"
                >
                  Set Up Profile
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentProfile;
