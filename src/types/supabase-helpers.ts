
// Helper types for Supabase database queries
export interface DatabasePlayer {
  id: string;
  full_name: string;
  position: string;
  citizenship: string;
  headshot_url?: string;
  photo_url?: string;
  jersey_number?: number;
  age?: number;
  bio?: string;
  market_value?: number;
  height?: number;
  weight?: number;
  date_of_birth?: string;
  gender?: string;
  place_of_birth?: string;
  foot?: string;
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
}

export interface DatabaseTeam {
  id: string;
  team_name: string;
  country: string;
  logo_url?: string;
  member_association?: string;
  sport_type?: string;
}

export interface DatabaseAgent {
  id: string;
  agency_name: string;
  profile_id: string;
}

// Helper function to extract single object from array result
export function extractSingleResult<T>(result: T[] | T): T | null {
  if (Array.isArray(result)) {
    return result.length > 0 ? result[0] : null;
  }
  return result;
}

// Helper function to safely access array properties
export function safeArrayAccess<T>(arr: T[] | T, accessor: (item: T) => any): any {
  const item = extractSingleResult(arr);
  return item ? accessor(item) : null;
}
