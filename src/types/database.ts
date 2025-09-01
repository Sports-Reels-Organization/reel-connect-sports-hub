
export interface TeamData {
  id: string;
  team_name: string;
  country: string;
  sport_type: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby';
  league: string;
  logo_url?: string;
  member_association?: string;
  year_founded?: number;
  description?: string;
  titles?: string[];
  profile_id: string;
  created_at: string;
  updated_at: string;
  verified: boolean;
  website?: string;
  division?: string;
}

export interface PlayerData {
  id: string;
  full_name: string;
  position: string;
  citizenship: string;
  photo_url?: string;
  headshot_url?: string;
  market_value?: number;
  age?: number;
  date_of_birth?: string;
  bio?: string;
  height?: number;
  weight?: number;
  foot?: string;
  jersey_number?: number;
  gender?: string;
  place_of_birth?: string;
  player_agent?: string;
  current_club?: string;
  joined_date?: string;
  contract_expires?: string;
  fifa_id?: string;
  portrait_url?: string;
  full_body_url?: string;
  leagues_participated?: string[];
  titles_seasons?: string[];
  transfer_history?: any;
  international_duty?: any;
  match_stats?: any;
  ai_analysis?: any;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TransferPitchData {
  id: string;
  team_id: string;
  player_id: string;
  asking_price?: number;
  currency: string;
  transfer_type: 'permanent' | 'loan';
  expires_at: string;
  status: string;
  deal_stage?: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  message_count?: number;
  shortlist_count?: number;
}

export interface AgentData {
  id: string;
  profile_id: string;
  agency_name: string;
  bio?: string;
  website?: string;
  license_number?: string;
  fifa_id?: string;
  verified: boolean;
  specialization?: string[];
  created_at: string;
  updated_at: string;
}
