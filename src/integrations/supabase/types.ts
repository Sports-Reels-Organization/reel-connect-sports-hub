export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_requests: {
        Row: {
          agent_id: string
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          currency: string | null
          description: string
          expires_at: string | null
          id: string
          is_public: boolean | null
          position: string | null
          sport_type: Database["public"]["Enums"]["sport_type"]
          title: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          description: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          position?: string | null
          sport_type: Database["public"]["Enums"]["sport_type"]
          title: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          position?: string | null
          sport_type?: Database["public"]["Enums"]["sport_type"]
          title?: string
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agency_name: string
          bio: string | null
          created_at: string | null
          fifa_id: string | null
          id: string
          license_number: string | null
          profile_id: string
          specialization: Database["public"]["Enums"]["sport_type"][] | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          agency_name: string
          bio?: string | null
          created_at?: string | null
          fifa_id?: string | null
          id?: string
          license_number?: string | null
          profile_id: string
          specialization?: Database["public"]["Enums"]["sport_type"][] | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          agency_name?: string
          bio?: string | null
          created_at?: string | null
          fifa_id?: string | null
          id?: string
          license_number?: string | null
          profile_id?: string
          specialization?: Database["public"]["Enums"]["sport_type"][] | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          agent_id: string | null
          contract_type: string
          created_at: string | null
          id: string
          player_id: string
          signed_contract_url: string | null
          status: string | null
          team_id: string | null
          template_url: string | null
          terms: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          contract_type: string
          created_at?: string | null
          id?: string
          player_id: string
          signed_contract_url?: string | null
          status?: string | null
          team_id?: string | null
          template_url?: string | null
          terms?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          contract_type?: string
          created_at?: string | null
          id?: string
          player_id?: string
          signed_contract_url?: string | null
          status?: string | null
          team_id?: string | null
          template_url?: string | null
          terms?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_videos: {
        Row: {
          compressed_video_url: string | null
          created_at: string | null
          duration: number | null
          file_size: number | null
          final_score: string | null
          home_or_away: string | null
          id: string
          is_processed: boolean | null
          league: string
          match_date: string | null
          match_stats: Json | null
          opposing_team: string
          tagged_players: Json | null
          team_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          compressed_video_url?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          final_score?: string | null
          home_or_away?: string | null
          id?: string
          is_processed?: boolean | null
          league: string
          match_date?: string | null
          match_stats?: Json | null
          opposing_team: string
          tagged_players?: Json | null
          team_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          compressed_video_url?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          final_score?: string | null
          home_or_away?: string | null
          id?: string
          is_processed?: boolean | null
          league?: string
          match_date?: string | null
          match_stats?: Json | null
          opposing_team?: string
          tagged_players?: Json | null
          team_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_videos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_urls: Json | null
          content: string
          created_at: string | null
          id: string
          is_flagged: boolean | null
          message_thread_id: string | null
          pitch_id: string | null
          player_id: string | null
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["message_status"] | null
          subject: string | null
          transfer_pitch_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_urls?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          message_thread_id?: string | null
          pitch_id?: string | null
          player_id?: string | null
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string | null
          transfer_pitch_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_urls?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          message_thread_id?: string | null
          pitch_id?: string | null
          player_id?: string | null
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string | null
          transfer_pitch_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "transfer_pitches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_transfer_pitch_id_fkey"
            columns: ["transfer_pitch_id"]
            isOneToOne: false
            referencedRelation: "transfer_pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_flagged: boolean | null
          is_read: boolean | null
          message_type: string | null
          pitch_id: string | null
          player_id: string | null
          receiver_id: string
          request_id: string | null
          sender_id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          pitch_id?: string | null
          player_id?: string | null
          receiver_id: string
          request_id?: string | null
          sender_id: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          pitch_id?: string | null
          player_id?: string | null
          receiver_id?: string
          request_id?: string | null
          sender_id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_messages_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "transfer_pitches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "agent_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_performance: {
        Row: {
          assists: number | null
          clean_sheets: number | null
          created_at: string | null
          goals: number | null
          id: string
          league: string | null
          matches_played: number | null
          minutes_played: number | null
          player_id: string | null
          red_cards: number | null
          saves: number | null
          season: string
          updated_at: string | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          league?: string | null
          matches_played?: number | null
          minutes_played?: number | null
          player_id?: string | null
          red_cards?: number | null
          saves?: number | null
          season: string
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          league?: string | null
          matches_played?: number | null
          minutes_played?: number | null
          player_id?: string | null
          red_cards?: number | null
          saves?: number | null
          season?: string
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_performance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          additional_stats: Json | null
          assists: number | null
          created_at: string | null
          goals: number | null
          id: string
          matches_played: number | null
          minutes_played: number | null
          player_id: string
          red_cards: number | null
          season: string
          updated_at: string | null
          yellow_cards: number | null
        }
        Insert: {
          additional_stats?: Json | null
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          matches_played?: number | null
          minutes_played?: number | null
          player_id: string
          red_cards?: number | null
          season: string
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Update: {
          additional_stats?: Json | null
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          matches_played?: number | null
          minutes_played?: number | null
          player_id?: string
          red_cards?: number | null
          season?: string
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          ai_analysis: Json | null
          bio: string | null
          citizenship: string
          contract_expires: string | null
          created_at: string | null
          current_club: string | null
          date_of_birth: string | null
          fifa_id: string | null
          foot: string | null
          full_body_url: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          headshot_url: string | null
          height: number | null
          id: string
          international_duty: Json | null
          jersey_number: number | null
          joined_date: string | null
          leagues_participated: string[] | null
          market_value: number | null
          match_stats: Json | null
          photo_url: string | null
          place_of_birth: string | null
          player_agent: string | null
          portrait_url: string | null
          position: string
          team_id: string
          titles_seasons: string[] | null
          transfer_history: Json | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          bio?: string | null
          citizenship: string
          contract_expires?: string | null
          created_at?: string | null
          current_club?: string | null
          date_of_birth?: string | null
          fifa_id?: string | null
          foot?: string | null
          full_body_url?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          headshot_url?: string | null
          height?: number | null
          id?: string
          international_duty?: Json | null
          jersey_number?: number | null
          joined_date?: string | null
          leagues_participated?: string[] | null
          market_value?: number | null
          match_stats?: Json | null
          photo_url?: string | null
          place_of_birth?: string | null
          player_agent?: string | null
          portrait_url?: string | null
          position: string
          team_id: string
          titles_seasons?: string[] | null
          transfer_history?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          bio?: string | null
          citizenship?: string
          contract_expires?: string | null
          created_at?: string | null
          current_club?: string | null
          date_of_birth?: string | null
          fifa_id?: string | null
          foot?: string | null
          full_body_url?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          headshot_url?: string | null
          height?: number | null
          id?: string
          international_duty?: Json | null
          jersey_number?: number | null
          joined_date?: string | null
          leagues_participated?: string[] | null
          market_value?: number | null
          match_stats?: Json | null
          photo_url?: string | null
          place_of_birth?: string | null
          player_agent?: string | null
          portrait_url?: string | null
          position?: string
          team_id?: string
          titles_seasons?: string[] | null
          transfer_history?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_verified: boolean | null
          phone: string | null
          profile_completed: boolean | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      shortlist: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          notes: string | null
          pitch_id: string
          player_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          pitch_id: string
          player_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          pitch_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "transfer_pitches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          country: string
          created_at: string | null
          description: string | null
          id: string
          league: string | null
          logo_url: string | null
          member_association: string | null
          profile_id: string
          sport_type: Database["public"]["Enums"]["sport_type"]
          team_name: string
          titles: string[] | null
          updated_at: string | null
          verified: boolean | null
          year_founded: number | null
        }
        Insert: {
          country: string
          created_at?: string | null
          description?: string | null
          id?: string
          league?: string | null
          logo_url?: string | null
          member_association?: string | null
          profile_id: string
          sport_type: Database["public"]["Enums"]["sport_type"]
          team_name: string
          titles?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          year_founded?: number | null
        }
        Update: {
          country?: string
          created_at?: string | null
          description?: string | null
          id?: string
          league?: string | null
          logo_url?: string | null
          member_association?: string | null
          profile_id?: string
          sport_type?: Database["public"]["Enums"]["sport_type"]
          team_name?: string
          titles?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          year_founded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_pitches: {
        Row: {
          asking_price: number | null
          contract_details: Json | null
          created_at: string | null
          currency: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_international: boolean | null
          loan_fee: number | null
          loan_with_obligation: boolean | null
          loan_with_option: boolean | null
          performance_bonus: number | null
          player_id: string
          player_salary: number | null
          relocation_support: number | null
          service_charge_rate: number | null
          sign_on_bonus: number | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          tagged_videos: Json | null
          team_id: string
          tier_level: string | null
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string | null
        }
        Insert: {
          asking_price?: number | null
          contract_details?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_international?: boolean | null
          loan_fee?: number | null
          loan_with_obligation?: boolean | null
          loan_with_option?: boolean | null
          performance_bonus?: number | null
          player_id: string
          player_salary?: number | null
          relocation_support?: number | null
          service_charge_rate?: number | null
          sign_on_bonus?: number | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          tagged_videos?: Json | null
          team_id: string
          tier_level?: string | null
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string | null
        }
        Update: {
          asking_price?: number | null
          contract_details?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_international?: boolean | null
          loan_fee?: number | null
          loan_with_obligation?: boolean | null
          loan_with_option?: boolean | null
          performance_bonus?: number | null
          player_id?: string
          player_salary?: number | null
          relocation_support?: number | null
          service_charge_rate?: number | null
          sign_on_bonus?: number | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          tagged_videos?: Json | null
          team_id?: string
          tier_level?: string | null
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_pitches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_pitches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      video: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          team_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          team_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          team_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
        }
        Relationships: []
      }
      video_requirements: {
        Row: {
          id: string
          last_updated: string | null
          team_id: string
          video_count: number | null
        }
        Insert: {
          id?: string
          last_updated?: string | null
          team_id: string
          video_count?: number | null
        }
        Update: {
          id?: string
          last_updated?: string | null
          team_id?: string
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_requirements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_public: boolean | null
          match_date: string | null
          opposing_team: string | null
          player_id: string | null
          score: string | null
          tagged_players: Json | null
          tags: string[] | null
          team_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_type: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_public?: boolean | null
          match_date?: string | null
          opposing_team?: string | null
          player_id?: string | null
          score?: string | null
          tagged_players?: Json | null
          tags?: string[] | null
          team_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_type?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_public?: boolean | null
          match_date?: string | null
          opposing_team?: string | null
          player_id?: string | null
          score?: string | null
          tagged_players?: Json | null
          tags?: string[] | null
          team_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_type?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_transfer_pitch_requirements: {
        Args: { p_team_id: string; p_player_id: string }
        Returns: boolean
      }
    }
    Enums: {
      gender: "male" | "female" | "other"
      gender_type: "male" | "female" | "other"
      message_status: "sent" | "delivered" | "read"
      sport_type: "football" | "basketball" | "volleyball" | "tennis" | "rugby"
      transfer_status: "active" | "expired" | "completed" | "cancelled"
      transfer_type: "loan" | "permanent"
      user_type: "team" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gender: ["male", "female", "other"],
      gender_type: ["male", "female", "other"],
      message_status: ["sent", "delivered", "read"],
      sport_type: ["football", "basketball", "volleyball", "tennis", "rugby"],
      transfer_status: ["active", "expired", "completed", "cancelled"],
      transfer_type: ["loan", "permanent"],
      user_type: ["team", "agent"],
    },
  },
} as const
