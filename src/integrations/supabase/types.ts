export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          challenger_id: string | null
          challenger_score: number | null
          completed_at: string | null
          created_at: string
          creator_id: string
          creator_score: number
          id: string
          scenario_env: string
          scenario_role: string
          status: string
        }
        Insert: {
          challenger_id?: string | null
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          creator_score: number
          id?: string
          scenario_env: string
          scenario_role: string
          status?: string
        }
        Update: {
          challenger_id?: string | null
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          creator_score?: number
          id?: string
          scenario_env?: string
          scenario_role?: string
          status?: string
        }
        Relationships: []
      }
      clan_bans: {
        Row: {
          banned_by: string
          clan_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          banned_by: string
          clan_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          banned_by?: string
          clan_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_bans_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_invites: {
        Row: {
          clan_id: string
          created_at: string
          id: string
          invited_by: string
          invited_user_id: string
          status: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          id?: string
          invited_by: string
          invited_user_id: string
          status?: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_invites_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["clan_role"]
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["clan_role"]
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["clan_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_messages: {
        Row: {
          clan_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clan_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_messages_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_referrals: {
        Row: {
          clan_id: string
          created_at: string
          id: string
          points_awarded: number
          referred_by: string
          referred_user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          id?: string
          points_awarded?: number
          referred_by: string
          referred_user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          id?: string
          points_awarded?: number
          referred_by?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_referrals_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_rivalries: {
        Row: {
          clan_a_id: string
          clan_a_score: number
          clan_a_sessions: number
          clan_b_id: string
          clan_b_score: number
          clan_b_sessions: number
          created_at: string
          id: string
          status: string
          week_start: string
          winner_clan_id: string | null
        }
        Insert: {
          clan_a_id: string
          clan_a_score?: number
          clan_a_sessions?: number
          clan_b_id: string
          clan_b_score?: number
          clan_b_sessions?: number
          created_at?: string
          id?: string
          status?: string
          week_start: string
          winner_clan_id?: string | null
        }
        Update: {
          clan_a_id?: string
          clan_a_score?: number
          clan_a_sessions?: number
          clan_b_id?: string
          clan_b_score?: number
          clan_b_sessions?: number
          created_at?: string
          id?: string
          status?: string
          week_start?: string
          winner_clan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clan_rivalries_clan_a_id_fkey"
            columns: ["clan_a_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_rivalries_clan_b_id_fkey"
            columns: ["clan_b_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_rivalries_winner_clan_id_fkey"
            columns: ["winner_clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_weekly_results: {
        Row: {
          clan_id: string
          clan_name: string
          created_at: string
          id: string
          rank: number
          total_score: number
          total_sessions: number
          week_start: string
        }
        Insert: {
          clan_id: string
          clan_name: string
          created_at?: string
          id?: string
          rank?: number
          total_score?: number
          total_sessions?: number
          week_start: string
        }
        Update: {
          clan_id?: string
          clan_name?: string
          created_at?: string
          id?: string
          rank?: number
          total_score?: number
          total_sessions?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_weekly_results_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          avatar_url: string | null
          clan_elo: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          join_type: Database["public"]["Enums"]["clan_join_type"]
          name: string
          referral_points: number
          total_members: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          clan_elo?: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          join_type?: Database["public"]["Enums"]["clan_join_type"]
          name: string
          referral_points?: number
          total_members?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          clan_elo?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          join_type?: Database["public"]["Enums"]["clan_join_type"]
          name?: string
          referral_points?: number
          total_members?: number
          updated_at?: string
        }
        Relationships: []
      }
      elo_history: {
        Row: {
          created_at: string
          delta: number
          elo: number
          id: string
          session_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          elo: number
          id?: string
          session_score: number
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          elo?: number
          id?: string
          session_score?: number
          user_id?: string
        }
        Relationships: []
      }
      evaluator_reviews: {
        Row: {
          created_at: string
          evaluator_id: string
          feedback: string | null
          id: string
          score: number
          session_date: string
          session_user_id: string
        }
        Insert: {
          created_at?: string
          evaluator_id: string
          feedback?: string | null
          id?: string
          score: number
          session_date: string
          session_user_id: string
        }
        Update: {
          created_at?: string
          evaluator_id?: string
          feedback?: string | null
          id?: string
          score?: number
          session_date?: string
          session_user_id?: string
        }
        Relationships: []
      }
      expert_challenge_attempts: {
        Row: {
          beat_expert: boolean
          challenge_id: string
          created_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          beat_expert?: boolean
          challenge_id: string
          created_at?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          beat_expert?: boolean
          challenge_id?: string
          created_at?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "expert_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_challenges: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          difficulty: string
          expert_name: string
          expert_role: string
          expert_score: number
          id: string
          is_active: boolean
          scenario_env: string
          scenario_role: string
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          difficulty?: string
          expert_name: string
          expert_role: string
          expert_score: number
          id?: string
          is_active?: boolean
          scenario_env: string
          scenario_role: string
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          difficulty?: string
          expert_name?: string
          expert_role?: string
          expert_score?: number
          id?: string
          is_active?: boolean
          scenario_env?: string
          scenario_role?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          elo: number
          evaluator_reputation: number
          id: string
          is_evaluator: boolean
          reviews_given: number
          total_sessions: number
          updated_at: string
          week_start: string
          weekly_elo_gain: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          elo?: number
          evaluator_reputation?: number
          id: string
          is_evaluator?: boolean
          reviews_given?: number
          total_sessions?: number
          updated_at?: string
          week_start?: string
          weekly_elo_gain?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          elo?: number
          evaluator_reputation?: number
          id?: string
          is_evaluator?: boolean
          reviews_given?: number
          total_sessions?: number
          updated_at?: string
          week_start?: string
          weekly_elo_gain?: number
        }
        Relationships: []
      }
      promotion_attempts: {
        Row: {
          created_at: string
          elo_at_attempt: number
          id: string
          passed: boolean
          session_score: number
          target_rank: string
          user_id: string
        }
        Insert: {
          created_at?: string
          elo_at_attempt: number
          id?: string
          passed?: boolean
          session_score: number
          target_rank: string
          user_id: string
        }
        Update: {
          created_at?: string
          elo_at_attempt?: number
          id?: string
          passed?: boolean
          session_score?: number
          target_rank?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenge_badges: {
        Row: {
          badge_type: string
          clan_id: string
          clan_name: string
          created_at: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          badge_type?: string
          clan_id: string
          clan_name: string
          created_at?: string
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          badge_type?: string
          clan_id?: string
          clan_name?: string
          created_at?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenge_badges_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clan_member: {
        Args: { _clan_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "evaluator" | "user"
      clan_join_type: "public" | "invite_only"
      clan_role: "leader" | "officer" | "member"
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
      app_role: ["admin", "evaluator", "user"],
      clan_join_type: ["public", "invite_only"],
      clan_role: ["leader", "officer", "member"],
    },
  },
} as const
