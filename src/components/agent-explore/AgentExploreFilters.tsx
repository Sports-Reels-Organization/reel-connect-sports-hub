
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, X, Save, Bookmark } from 'lucide-react';

interface AgentExploreFiltersProps {
  activeFilters: any;
  onFiltersChange: (filters: any) => void;
  sportPositions: Record<string, string[]>;
  transferTypes: Array<{ value: string; label: string }>;
  categories: Array<{ value: string; label: string }>;
  dealStages: Array<{ value: string; label: string }>;
}

export const AgentExploreFilters: React.FC<AgentExploreFiltersProps> = ({
  activeFilters,
  onFiltersChange,
  sportPositions,
  transferTypes,
  categories,
  dealStages
}) => {
  const budgetRanges = [
    { value: '0-100000', label: 'Under $100K' },
    { value: '100000-500000', label: '$100K - $500K' },
    { value: '500000-1000000', label: '$500K - $1M' },
    { value: '1000000-5000000', label: '$1M - $5M' },
    { value: '5000000-999999999', label: 'Over $5M' }
  ];

  const passportOptions = [
    { value: 'all', label: 'All Passports' },
    { value: 'eu', label: 'EU Passport' },
    { value: 'african', label: 'African Passport' },
    { value: 'asian', label: 'Asian Passport' },
    { value: 'american', label: 'American Passport' },
    { value: 'australian', label: 'Australian Passport' }
  ];

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value === 'all' ? '' : value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const saveFilters = () => {
    // TODO: Implement save filters functionality
    console.log('Save filters:', activeFilters);
  };

  const activeFilterCount = Object.values(activeFilters).filter(value => value && value !== 'all').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={saveFilters}
              disabled={activeFilterCount === 0}
            >
              <Bookmark className="w-4 h-4 mr-1" />
              Save
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Position */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Select 
              value={activeFilters.position || 'all'} 
              onValueChange={(value) => updateFilter('position', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {(sportPositions.football || []).map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Type */}
          <div className="space-y-2">
            <Label>Transfer Type</Label>
            <Select 
              value={activeFilters.transfer_type || 'all'} 
              onValueChange={(value) => updateFilter('transfer_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {transferTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label>Budget Range</Label>
            <Select 
              value={activeFilters.budget_range || 'all'} 
              onValueChange={(value) => updateFilter('budget_range', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                {budgetRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={activeFilters.category || 'all'} 
              onValueChange={(value) => updateFilter('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deal Stage */}
          <div className="space-y-2">
            <Label>Deal Stage</Label>
            <Select 
              value={activeFilters.deal_stage || 'all'} 
              onValueChange={(value) => updateFilter('deal_stage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {dealStages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Passport Requirement */}
          <div className="space-y-2">
            <Label>Passport</Label>
            <Select 
              value={activeFilters.passport_requirement || 'all'} 
              onValueChange={(value) => updateFilter('passport_requirement', value)}
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

          {/* Country */}
          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={activeFilters.country || ''}
              onChange={(e) => updateFilter('country', e.target.value)}
              placeholder="Any country"
            />
          </div>

          {/* League Level */}
          <div className="space-y-2">
            <Label>League/Division</Label>
            <Input
              value={activeFilters.league_level || ''}
              onChange={(e) => updateFilter('league_level', e.target.value)}
              placeholder="Any league"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentExploreFilters;
