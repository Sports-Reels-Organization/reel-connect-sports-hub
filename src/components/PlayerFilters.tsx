
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Save, Download } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;

interface FilterState {
  search: string;
  position: string;
  ageMin: string;
  ageMax: string;
  heightMin: string;
  heightMax: string;
  citizenship: string;
  contractExpiry: string;
  marketValueMin: string;
  marketValueMax: string;
  availability: string;
  tags: string[];
}

interface PlayerFiltersProps {
  players: DatabasePlayer[];
  onFilteredPlayersChange: (filteredPlayers: DatabasePlayer[]) => void;
  onExportPlayers: (players: DatabasePlayer[]) => void;
}

const PlayerFilters: React.FC<PlayerFiltersProps> = ({
  players,
  onFilteredPlayersChange,
  onExportPlayers
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    position: 'all',
    ageMin: '',
    ageMax: '',
    heightMin: '',
    heightMax: '',
    citizenship: 'all',
    contractExpiry: 'all',
    marketValueMin: '',
    marketValueMax: '',
    availability: 'all',
    tags: []
  });

  const [savedFilters, setSavedFilters] = useState<{name: string, filters: FilterState}[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyFilters = (filterState: FilterState = filters) => {
    let filtered = [...players];

    // Search filter
    if (filterState.search) {
      const searchLower = filterState.search.toLowerCase();
      filtered = filtered.filter(player => 
        player.full_name?.toLowerCase().includes(searchLower) ||
        player.position?.toLowerCase().includes(searchLower) ||
        player.citizenship?.toLowerCase().includes(searchLower)
      );
    }

    // Position filter
    if (filterState.position && filterState.position !== 'all') {
      filtered = filtered.filter(player => player.position === filterState.position);
    }

    // Age range filter
    if (filterState.ageMin || filterState.ageMax) {
      filtered = filtered.filter(player => {
        if (!player.age) return false;
        const ageMin = filterState.ageMin ? parseInt(filterState.ageMin) : 0;
        const ageMax = filterState.ageMax ? parseInt(filterState.ageMax) : 100;
        return player.age >= ageMin && player.age <= ageMax;
      });
    }

    // Height range filter
    if (filterState.heightMin || filterState.heightMax) {
      filtered = filtered.filter(player => {
        if (!player.height) return false;
        const heightMin = filterState.heightMin ? parseInt(filterState.heightMin) : 0;
        const heightMax = filterState.heightMax ? parseInt(filterState.heightMax) : 300;
        return player.height >= heightMin && player.height <= heightMax;
      });
    }

    // Citizenship filter
    if (filterState.citizenship && filterState.citizenship !== 'all') {
      filtered = filtered.filter(player => player.citizenship === filterState.citizenship);
    }

    // Contract expiry filter
    if (filterState.contractExpiry && filterState.contractExpiry !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filterState.contractExpiry) {
        case 'expiring_soon':
          cutoffDate.setMonth(now.getMonth() + 6);
          filtered = filtered.filter(player => 
            player.contract_expires && new Date(player.contract_expires) <= cutoffDate
          );
          break;
        case 'expired':
          filtered = filtered.filter(player => 
            player.contract_expires && new Date(player.contract_expires) <= now
          );
          break;
        case 'long_term':
          cutoffDate.setFullYear(now.getFullYear() + 2);
          filtered = filtered.filter(player => 
            player.contract_expires && new Date(player.contract_expires) >= cutoffDate
          );
          break;
      }
    }

    // Market value range filter
    if (filterState.marketValueMin || filterState.marketValueMax) {
      filtered = filtered.filter(player => {
        if (!player.market_value) return false;
        const valueMin = filterState.marketValueMin ? parseFloat(filterState.marketValueMin) : 0;
        const valueMax = filterState.marketValueMax ? parseFloat(filterState.marketValueMax) : Infinity;
        return player.market_value >= valueMin && player.market_value <= valueMax;
      });
    }

    onFilteredPlayersChange(filtered);
  };

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      search: '',
      position: 'all',
      ageMin: '',
      ageMax: '',
      heightMin: '',
      heightMax: '',
      citizenship: 'all',
      contractExpiry: 'all',
      marketValueMin: '',
      marketValueMax: '',
      availability: 'all',
      tags: []
    };
    setFilters(emptyFilters);
    applyFilters(emptyFilters);
  };

  const saveCurrentFilter = () => {
    const name = prompt('Enter filter name:');
    if (name) {
      setSavedFilters(prev => [...prev, { name, filters }]);
    }
  };

  const loadSavedFilter = (savedFilter: {name: string, filters: FilterState}) => {
    setFilters(savedFilter.filters);
    applyFilters(savedFilter.filters);
  };

  const getUniqueValues = (field: keyof DatabasePlayer): string[] => {
    const values = players
      .map(p => {
        const value = p[field];
        if (value === null || value === undefined) return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      })
      .filter((value): value is string => Boolean(value));
    
    return [...new Set(values)];
  };

  return (
    <Card className="border-gray-700 mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-polysans flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Player Filters
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-white border-gray-600"
            >
              Advanced Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveCurrentFilter}
              className="text-white border-gray-600"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportPlayers(players)}
              className="text-white border-gray-600"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label className="text-white">Search Players</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, position, nationality..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-white">Position</Label>
            <Select value={filters.position} onValueChange={(value) => updateFilter('position', value)}>
              <SelectTrigger className="bg-gray-700 text-white border-gray-600 w-40">
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                <SelectItem value="defender">Defender</SelectItem>
                <SelectItem value="midfielder">Midfielder</SelectItem>
                <SelectItem value="forward">Forward</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filters.search || (filters.position !== 'all') || (filters.citizenship !== 'all')) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-white border-gray-600"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
            <div>
              <Label className="text-white">Age Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.ageMin}
                  onChange={(e) => updateFilter('ageMin', e.target.value)}
                  className="bg-gray-700 text-white border-gray-600"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.ageMax}
                  onChange={(e) => updateFilter('ageMax', e.target.value)}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Height Range (cm)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.heightMin}
                  onChange={(e) => updateFilter('heightMin', e.target.value)}
                  className="bg-gray-700 text-white border-gray-600"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.heightMax}
                  onChange={(e) => updateFilter('heightMax', e.target.value)}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Market Value Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.marketValueMin}
                  onChange={(e) => updateFilter('marketValueMin', e.target.value)}
                  className="bg-gray-700 text-white border-gray-600"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.marketValueMax}
                  onChange={(e) => updateFilter('marketValueMax', e.target.value)}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Citizenship</Label>
              <Select value={filters.citizenship} onValueChange={(value) => updateFilter('citizenship', value)}>
                <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {getUniqueValues('citizenship').map((country, index) => (
                    <SelectItem key={`country-${index}`} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Contract Status</Label>
              <Select value={filters.contractExpiry} onValueChange={(value) => updateFilter('contractExpiry', value)}>
                <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="All contracts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contracts</SelectItem>
                  <SelectItem value="expiring_soon">Expiring in 6 months</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="long_term">Long-term (2+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div>
            <Label className="text-white mb-2 block">Saved Filters</Label>
            <div className="flex gap-2 flex-wrap">
              {savedFilters.map((saved, index) => (
                <Badge
                  key={`saved-filter-${index}`}
                  variant="outline"
                  className="cursor-pointer hover:bg-rosegold text-white border-gray-600"
                  onClick={() => loadSavedFilter(saved)}
                >
                  {saved.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerFilters;
