
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Send } from 'lucide-react';

interface CreateAgentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sportPositions: Record<string, string[]>;
  transferTypes: Array<{ value: string; label: string }>;
  categories: Array<{ value: string; label: string }>;
}

export const CreateAgentRequestModal: React.FC<CreateAgentRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sportPositions,
  transferTypes,
  categories
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [agentSportType, setAgentSportType] = useState<string>('football');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position: '',
    transfer_type: 'permanent',
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    passport_requirement: '',
    league_level: '',
    country: '',
    category: ''
  });

  const passportOptions = [
    { value: 'all', label: 'All Passports' },
    { value: 'eu', label: 'EU Passport' },
    { value: 'african', label: 'African Passport' },
    { value: 'asian', label: 'Asian Passport' },
    { value: 'american', label: 'American Passport' },
    { value: 'australian', label: 'Australian Passport' }
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'];

  useEffect(() => {
    fetchAgentSportType();
  }, [profile]);

  const fetchAgentSportType = async () => {
    if (!profile?.user_type || profile.user_type !== 'agent') return;

    try {
      const { data } = await supabase
        .from('agents')
        .select('specialization')
        .eq('profile_id', profile.id)
        .single();

      if (data?.specialization) {
        const sportTypes = Array.isArray(data.specialization) 
          ? data.specialization 
          : [data.specialization];
        setAgentSportType(sportTypes[0] || 'football');
      }
    } catch (error) {
      console.error('Error fetching agent sport type:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_type || profile.user_type !== 'agent') return;

    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and description",
        variant: "destructive"
      });
      return;
    }

    if (formData.description.length > 550) {
      toast({
        title: "Description Too Long",
        description: "Description must be 550 characters or less",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) {
        toast({
          title: "Profile Required",
          description: "Please complete your agent profile first",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('agent_requests')
        .insert({
          agent_id: agentData.id,
          title: formData.title,
          description: formData.description,
          position: formData.position || null,
          sport_type: agentSportType,
          transfer_type: formData.transfer_type,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
          currency: formData.currency,
          passport_requirement: formData.passport_requirement || null,
          league_level: formData.league_level || null,
          country: formData.country || null,
          category: formData.category || null,
          is_public: true
        });

      if (error) throw error;

      // Reset form
      setFormData({
        title: '',
        description: '',
        position: '',
        transfer_type: 'permanent',
        budget_min: '',
        budget_max: '',
        currency: 'USD',
        passport_requirement: '',
        league_level: '',
        country: '',
        category: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to post request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Post New Player Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Looking for Central Midfielder for Premier League"
              required
            />
          </div>

          {/* Position and Transfer Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select 
                value={formData.position} 
                onValueChange={(value) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Position</SelectItem>
                  {(sportPositions[agentSportType] || []).map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer_type">Transfer Type *</Label>
              <Select 
                value={formData.transfer_type} 
                onValueChange={(value) => setFormData({ ...formData, transfer_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transferTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_min">Min Budget</Label>
              <Input
                id="budget_min"
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Max Budget</Label>
              <Input
                id="budget_max"
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passport_requirement">Passport Requirement</Label>
              <Select 
                value={formData.passport_requirement} 
                onValueChange={(value) => setFormData({ ...formData, passport_requirement: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any passport" />
                </SelectTrigger>
                <SelectContent>
                  {passportOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="league_level">League/Division</Label>
              <Input
                id="league_level"
                value={formData.league_level}
                onChange={(e) => setFormData({ ...formData, league_level: e.target.value })}
                placeholder="e.g., Premier League, Serie A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., England, Italy"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description * (max 550 characters)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="I am looking for a central midfielder for a Premier League club in England for a permanent transfer with EU passport..."
              className="min-h-24"
              maxLength={550}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/550
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="flex items-center gap-2 flex-1"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Posting...' : 'Post Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentRequestModal;
