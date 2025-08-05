export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agent_request_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          profile_id: string
          request_id: string
          tagged_players: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          profile_id: string
          request_id: string
          tagged_players?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          profile_id?: string
          request_id?: string
          tagged_players?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_request_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "agent_requests"
            referencedColumns: ["id"]
          },
        ]
      }
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
          tagged_players: Json | null
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
          tagged_players?: Json | null
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
          tagged_players?: Json | null
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
      ai_analysis: {
        Row: {
          analysis_timestamp: number
          confidence_score: number | null
          created_at: string | null
          description: string
          event_type: string
          id: string
          metadata: Json | null
          tagged_players: string[] | null
          video_id: string | null
        }
        Insert: {
          analysis_timestamp: number
          confidence_score?: number | null
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          tagged_players?: string[] | null
          video_id?: string | null
        }
        Update: {
          analysis_timestamp?: number
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          tagged_players?: string[] | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
      international_transfer_restrictions: {
        Row: {
          created_at: string | null
          id: string
          resolved_at: string | null
          restriction_active: boolean | null
          restriction_reason: string | null
          restriction_type: string
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          restriction_active?: boolean | null
          restriction_reason?: string | null
          restriction_type: string
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          restriction_active?: boolean | null
          restriction_reason?: string | null
          restriction_type?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "international_transfer_restrictions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          country: string
          created_at: string | null
          id: string
          name: string
          region: string | null
          sport_type: string
          tier_level: number | null
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          name: string
          region?: string | null
          sport_type: string
          tier_level?: number | null
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          name?: string
          region?: string | null
          sport_type?: string
          tier_level?: number | null
        }
        Relationships: []
      }
      leagues_competitions: {
        Row: {
          country: string
          created_at: string | null
          id: string
          name: string
          region: string | null
          sport_type: string
          tier_level: number | null
          type: string
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          name: string
          region?: string | null
          sport_type: string
          tier_level?: number | null
          type?: string
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          name?: string
          region?: string | null
          sport_type?: string
          tier_level?: number | null
          type?: string
        }
        Relationships: []
      }
      match_statistics: {
        Row: {
          assists: number | null
          created_at: string | null
          goals: number | null
          id: string
          jersey_number: number | null
          minutes_played: number | null
          player_id: string | null
          red_cards: number | null
          second_yellow_cards: number | null
          video_id: string | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          jersey_number?: number | null
          minutes_played?: number | null
          player_id?: string | null
          red_cards?: number | null
          second_yellow_cards?: number | null
          video_id?: string | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          jersey_number?: number | null
          minutes_played?: number | null
          player_id?: string | null
          red_cards?: number | null
          second_yellow_cards?: number | null
          video_id?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_statistics_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
      message_violations: {
        Row: {
          action_taken: string | null
          detected_at: string | null
          id: string
          message_id: string | null
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string | null
          violation_content: string
          violation_type: string
        }
        Insert: {
          action_taken?: string | null
          detected_at?: string | null
          id?: string
          message_id?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string | null
          violation_content: string
          violation_type: string
        }
        Update: {
          action_taken?: string | null
          detected_at?: string | null
          id?: string
          message_id?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string | null
          violation_content?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_violations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_urls: Json | null
          auto_flag_contact: boolean | null
          content: string
          contract_file_url: string | null
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_flagged: boolean | null
          message_thread_id: string | null
          message_type: string | null
          pitch_context: boolean | null
          pitch_id: string | null
          player_id: string | null
          receiver_id: string
          requires_response: boolean | null
          response_deadline: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"] | null
          subject: string | null
          transfer_pitch_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_urls?: Json | null
          auto_flag_contact?: boolean | null
          content: string
          contract_file_url?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_flagged?: boolean | null
          message_thread_id?: string | null
          message_type?: string | null
          pitch_context?: boolean | null
          pitch_id?: string | null
          player_id?: string | null
          receiver_id: string
          requires_response?: boolean | null
          response_deadline?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string | null
          transfer_pitch_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_urls?: Json | null
          auto_flag_contact?: boolean | null
          content?: string
          contract_file_url?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_flagged?: boolean | null
          message_thread_id?: string | null
          message_type?: string | null
          pitch_context?: boolean | null
          pitch_id?: string | null
          player_id?: string | null
          receiver_id?: string
          requires_response?: boolean | null
          response_deadline?: string | null
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
            referencedRelation: "active_pitches_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_statistics_view"
            referencedColumns: ["pitch_id"]
          },
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
            referencedRelation: "active_pitches_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_transfer_pitch_id_fkey"
            columns: ["transfer_pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_statistics_view"
            referencedColumns: ["pitch_id"]
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
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          in_app_notifications: boolean | null
          login_notifications: boolean | null
          message_notifications: boolean | null
          newsletter_subscription: boolean | null
          profile_changes: boolean | null
          transfer_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          login_notifications?: boolean | null
          message_notifications?: boolean | null
          newsletter_subscription?: boolean | null
          profile_changes?: boolean | null
          transfer_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          login_notifications?: boolean | null
          message_notifications?: boolean | null
          newsletter_subscription?: boolean | null
          profile_changes?: boolean | null
          transfer_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      pitch_requirements: {
        Row: {
          checked_at: string | null
          id: string
          pitch_id: string | null
          requirement_details: Json | null
          requirement_met: boolean | null
          requirement_type: string
        }
        Insert: {
          checked_at?: string | null
          id?: string
          pitch_id?: string | null
          requirement_details?: Json | null
          requirement_met?: boolean | null
          requirement_type: string
        }
        Update: {
          checked_at?: string | null
          id?: string
          pitch_id?: string | null
          requirement_details?: Json | null
          requirement_met?: boolean | null
          requirement_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_requirements_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "active_pitches_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_requirements_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_statistics_view"
            referencedColumns: ["pitch_id"]
          },
          {
            foreignKeyName: "pitch_requirements_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "transfer_pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      player_international_duty: {
        Row: {
          appearances: number | null
          assists: number | null
          category: string
          country: string
          created_at: string | null
          debut_date: string | null
          goals: number | null
          id: string
          player_id: string | null
          red_cards: number | null
          season: string
          second_yellow_cards: number | null
          updated_at: string | null
          yellow_cards: number | null
        }
        Insert: {
          appearances?: number | null
          assists?: number | null
          category: string
          country: string
          created_at?: string | null
          debut_date?: string | null
          goals?: number | null
          id?: string
          player_id?: string | null
          red_cards?: number | null
          season: string
          second_yellow_cards?: number | null
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Update: {
          appearances?: number | null
          assists?: number | null
          category?: string
          country?: string
          created_at?: string | null
          debut_date?: string | null
          goals?: number | null
          id?: string
          player_id?: string | null
          red_cards?: number | null
          season?: string
          second_yellow_cards?: number | null
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_international_duty_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_league_participation: {
        Row: {
          appearances: number | null
          assists: number | null
          created_at: string | null
          goals: number | null
          id: string
          league_competition_id: string | null
          minutes_played: number | null
          player_id: string | null
          season: string
          updated_at: string | null
        }
        Insert: {
          appearances?: number | null
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          league_competition_id?: string | null
          minutes_played?: number | null
          player_id?: string | null
          season: string
          updated_at?: string | null
        }
        Update: {
          appearances?: number | null
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          league_competition_id?: string | null
          minutes_played?: number | null
          player_id?: string | null
          season?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_league_participation_league_competition_id_fkey"
            columns: ["league_competition_id"]
            isOneToOne: false
            referencedRelation: "leagues_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_league_participation_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "active_pitches_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_messages_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_statistics_view"
            referencedColumns: ["pitch_id"]
          },
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
      player_titles_achievements: {
        Row: {
          achievement_type: string
          competition: string | null
          created_at: string | null
          description: string | null
          id: string
          player_id: string | null
          season: string
          title: string
        }
        Insert: {
          achievement_type: string
          competition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          player_id?: string | null
          season: string
          title: string
        }
        Update: {
          achievement_type?: string
          competition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          player_id?: string | null
          season?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_titles_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_transfer_history: {
        Row: {
          created_at: string | null
          currency: string | null
          from_club: string | null
          id: string
          notes: string | null
          player_id: string | null
          to_club: string | null
          transfer_date: string
          transfer_type: string
          transfer_value: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          from_club?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
          to_club?: string | null
          transfer_date: string
          transfer_type?: string
          transfer_value?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          from_club?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
          to_club?: string | null
          transfer_date?: string
          transfer_type?: string
          transfer_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_transfer_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number | null
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
          age?: number | null
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
          age?: number | null
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
          consent_date: string | null
          contact_verified: boolean | null
          contact_warnings: number | null
          country: string | null
          country_code: string | null
          created_at: string | null
          email: string
          email_consent: boolean | null
          email_verified: boolean | null
          full_name: string
          id: string
          is_verified: boolean | null
          last_contact_check: string | null
          league: string | null
          newsletter_consent: boolean | null
          phone: string | null
          phone_verified: boolean | null
          profile_completed: boolean | null
          terms_accepted: boolean | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          consent_date?: string | null
          contact_verified?: boolean | null
          contact_warnings?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          email: string
          email_consent?: boolean | null
          email_verified?: boolean | null
          full_name: string
          id?: string
          is_verified?: boolean | null
          last_contact_check?: string | null
          league?: string | null
          newsletter_consent?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_completed?: boolean | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          consent_date?: string | null
          contact_verified?: boolean | null
          contact_warnings?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string
          email_consent?: boolean | null
          email_verified?: boolean | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          last_contact_check?: string | null
          league?: string | null
          newsletter_consent?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_completed?: boolean | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      service_charges: {
        Row: {
          charge_amount: number
          charge_applied_at: string | null
          charge_currency: string
          charge_paid_at: string | null
          charge_rate: number | null
          charge_status: string | null
          contract_id: string | null
          id: string
          pitch_id: string | null
        }
        Insert: {
          charge_amount: number
          charge_applied_at?: string | null
          charge_currency: string
          charge_paid_at?: string | null
          charge_rate?: number | null
          charge_status?: string | null
          contract_id?: string | null
          id?: string
          pitch_id?: string | null
        }
        Update: {
          charge_amount?: number
          charge_applied_at?: string | null
          charge_currency?: string
          charge_paid_at?: string | null
          charge_rate?: number | null
          charge_status?: string | null
          contract_id?: string | null
          id?: string
          pitch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_charges_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "active_pitches_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_charges_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_statistics_view"
            referencedColumns: ["pitch_id"]
          },
          {
            foreignKeyName: "service_charges_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "transfer_pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          notes: string | null
          pitch_id: string
          player_id: string
          priority_level: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          pitch_id: string
          player_id: string
          priority_level?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          pitch_id?: string
          player_id?: string
          priority_level?: string | null
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
            referencedRelation: "active_pitches_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitch_statistics_view"
            referencedColumns: ["pitch_id"]
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
          international_transfers_enabled: boolean | null
          last_pitch_reset_date: string | null
          league: string | null
          logo_url: string | null
          max_pitches_per_month: number | null
          member_association: string | null
          pitches_used_this_month: number | null
          profile_id: string
          sport_type: Database["public"]["Enums"]["sport_type"]
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
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
          international_transfers_enabled?: boolean | null
          last_pitch_reset_date?: string | null
          league?: string | null
          logo_url?: string | null
          max_pitches_per_month?: number | null
          member_association?: string | null
          pitches_used_this_month?: number | null
          profile_id: string
          sport_type: Database["public"]["Enums"]["sport_type"]
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
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
          international_transfers_enabled?: boolean | null
          last_pitch_reset_date?: string | null
          league?: string | null
          logo_url?: string | null
          max_pitches_per_month?: number | null
          member_association?: string | null
          pitches_used_this_month?: number | null
          profile_id?: string
          sport_type?: Database["public"]["Enums"]["sport_type"]
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
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
          auto_expire_enabled: boolean | null
          contract_details: Json | null
          contract_finalized: boolean | null
          contract_finalized_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          domestic_currency: string | null
          expires_at: string | null
          id: string
          international_currency: string | null
          is_featured: boolean | null
          is_international: boolean | null
          loan_fee: number | null
          loan_with_obligation: boolean | null
          loan_with_option: boolean | null
          message_count: number | null
          performance_bonus: number | null
          pitch_duration_days: number | null
          pitch_requirements_met: boolean | null
          player_id: string
          player_salary: number | null
          relocation_support: number | null
          service_charge_amount: number | null
          service_charge_applied: boolean | null
          service_charge_rate: number | null
          shortlist_count: number | null
          sign_on_bonus: number | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          tagged_videos: Json | null
          team_id: string
          tier_level: string | null
          total_transfer_value: number | null
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          asking_price?: number | null
          auto_expire_enabled?: boolean | null
          contract_details?: Json | null
          contract_finalized?: boolean | null
          contract_finalized_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          domestic_currency?: string | null
          expires_at?: string | null
          id?: string
          international_currency?: string | null
          is_featured?: boolean | null
          is_international?: boolean | null
          loan_fee?: number | null
          loan_with_obligation?: boolean | null
          loan_with_option?: boolean | null
          message_count?: number | null
          performance_bonus?: number | null
          pitch_duration_days?: number | null
          pitch_requirements_met?: boolean | null
          player_id: string
          player_salary?: number | null
          relocation_support?: number | null
          service_charge_amount?: number | null
          service_charge_applied?: boolean | null
          service_charge_rate?: number | null
          shortlist_count?: number | null
          sign_on_bonus?: number | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          tagged_videos?: Json | null
          team_id: string
          tier_level?: string | null
          total_transfer_value?: number | null
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          asking_price?: number | null
          auto_expire_enabled?: boolean | null
          contract_details?: Json | null
          contract_finalized?: boolean | null
          contract_finalized_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          domestic_currency?: string | null
          expires_at?: string | null
          id?: string
          international_currency?: string | null
          is_featured?: boolean | null
          is_international?: boolean | null
          loan_fee?: number | null
          loan_with_obligation?: boolean | null
          loan_with_option?: boolean | null
          message_count?: number | null
          performance_bonus?: number | null
          pitch_duration_days?: number | null
          pitch_requirements_met?: boolean | null
          player_id?: string
          player_salary?: number | null
          relocation_support?: number | null
          service_charge_amount?: number | null
          service_charge_applied?: boolean | null
          service_charge_rate?: number | null
          shortlist_count?: number | null
          sign_on_bonus?: number | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          tagged_videos?: Json | null
          team_id?: string
          tier_level?: string | null
          total_transfer_value?: number | null
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string | null
          view_count?: number | null
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
          ai_analysis_status: string | null
          compressed_url: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          file_size: number | null
          final_score_away: number | null
          final_score_home: number | null
          home_or_away: string | null
          id: string
          is_public: boolean | null
          league_id: string | null
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
          upload_status: string | null
          video_type: string | null
          video_url: string
        }
        Insert: {
          ai_analysis_status?: string | null
          compressed_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          final_score_away?: number | null
          final_score_home?: number | null
          home_or_away?: string | null
          id?: string
          is_public?: boolean | null
          league_id?: string | null
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
          upload_status?: string | null
          video_type?: string | null
          video_url: string
        }
        Update: {
          ai_analysis_status?: string | null
          compressed_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          final_score_away?: number | null
          final_score_home?: number | null
          home_or_away?: string | null
          id?: string
          is_public?: boolean | null
          league_id?: string | null
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
          upload_status?: string | null
          video_type?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
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
      active_pitches_view: {
        Row: {
          asking_price: number | null
          auto_expire_enabled: boolean | null
          contract_details: Json | null
          contract_finalized: boolean | null
          contract_finalized_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_currency: string | null
          domestic_currency: string | null
          expires_at: string | null
          id: string | null
          international_allowed: boolean | null
          international_currency: string | null
          international_transfers_enabled: boolean | null
          is_featured: boolean | null
          is_international: boolean | null
          loan_fee: number | null
          loan_with_obligation: boolean | null
          loan_with_option: boolean | null
          member_association: string | null
          message_count: number | null
          performance_bonus: number | null
          pitch_duration_days: number | null
          pitch_requirements_met: boolean | null
          player_citizenship: string | null
          player_id: string | null
          player_market_value: number | null
          player_name: string | null
          player_position: string | null
          player_salary: number | null
          relocation_support: number | null
          service_charge_amount: number | null
          service_charge_applied: boolean | null
          service_charge_rate: number | null
          shortlist_count: number | null
          sign_on_bonus: number | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          subscription_tier: string | null
          tagged_videos: Json | null
          team_country: string | null
          team_id: string | null
          team_name: string | null
          tier_level: string | null
          total_transfer_value: number | null
          transfer_type: Database["public"]["Enums"]["transfer_type"] | null
          updated_at: string | null
          view_count: number | null
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
      pitch_statistics_view: {
        Row: {
          created_at: string | null
          current_status: string | null
          days_active: number | null
          expires_at: string | null
          message_count: number | null
          pitch_id: string | null
          shortlist_count: number | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          current_status?: never
          days_active?: never
          expires_at?: string | null
          message_count?: number | null
          pitch_id?: string | null
          shortlist_count?: number | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          current_status?: never
          days_active?: never
          expires_at?: string | null
          message_count?: number | null
          pitch_id?: string | null
          shortlist_count?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_expire_pitches: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_age: {
        Args: { birth_date: string }
        Returns: number
      }
      delete_user_completely: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      send_message_notification: {
        Args: { receiver_id: string; sender_name: string; player_name?: string }
        Returns: boolean
      }
      send_profile_change_notification: {
        Args: { user_uuid: string; change_type: string }
        Returns: boolean
      }
      send_transfer_interest_notification: {
        Args: { team_owner_id: string; player_name: string; agent_name: string }
        Returns: boolean
      }
      send_welcome_notification: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      validate_pitch_requirements: {
        Args: { p_pitch_id: string }
        Returns: boolean
      }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
