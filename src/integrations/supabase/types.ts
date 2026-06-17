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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_earnings: {
        Row: {
          amount: number
          created_at: string
          earned_date: string
          id: string
          investment_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          earned_date?: string
          id?: string
          investment_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          earned_date?: string
          id?: string
          investment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_earnings_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_otps: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          verified?: boolean
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          daily_return: number | null
          days_paid: number | null
          id: string
          status: Database["public"]["Enums"]["investment_status"]
          total_days: number | null
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          daily_return?: number | null
          days_paid?: number | null
          id?: string
          status?: Database["public"]["Enums"]["investment_status"]
          total_days?: number | null
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          daily_return?: number | null
          days_paid?: number | null
          id?: string
          status?: Database["public"]["Enums"]["investment_status"]
          total_days?: number | null
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mlm_commissions: {
        Row: {
          amount: number
          created_at: string
          daily_earning_id: string
          downline_id: string
          earned_date: string
          id: string
          level: number
          percentage: number
          referrer_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          daily_earning_id: string
          downline_id: string
          earned_date?: string
          id?: string
          level: number
          percentage: number
          referrer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          daily_earning_id?: string
          downline_id?: string
          earned_date?: string
          id?: string
          level?: number
          percentage?: number
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mlm_commissions_daily_earning_id_fkey"
            columns: ["daily_earning_id"]
            isOneToOne: false
            referencedRelation: "daily_earnings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          block_reason: string | null
          created_at: string
          current_rank_id: string | null
          direct_referrals_count: number
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          referral_code: string | null
          referred_by: string | null
          team_size: number
          team_volume: number
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          current_rank_id?: string | null
          direct_referrals_count?: number
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          referral_code?: string | null
          referred_by?: string | null
          team_size?: number
          team_volume?: number
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          current_rank_id?: string | null
          direct_referrals_count?: number
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          referral_code?: string | null
          referred_by?: string | null
          team_size?: number
          team_volume?: number
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_rank_id_fkey"
            columns: ["current_rank_id"]
            isOneToOne: false
            referencedRelation: "rank_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_tiers: {
        Row: {
          badge_color: string
          bonus_percentage: number
          created_at: string
          id: string
          min_direct_referrals: number
          min_team_size: number
          min_team_volume_usd: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge_color?: string
          bonus_percentage?: number
          created_at?: string
          id?: string
          min_direct_referrals?: number
          min_team_size?: number
          min_team_volume_usd?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge_color?: string
          bonus_percentage?: number
          created_at?: string
          id?: string
          min_direct_referrals?: number
          min_team_size?: number
          min_team_volume_usd?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          active_investors_display: number | null
          id: string
          qr_code_url: string | null
          total_invested_display: number | null
          total_payouts_display: number | null
          updated_at: string
          usdt_address: string
        }
        Insert: {
          active_investors_display?: number | null
          id?: string
          qr_code_url?: string | null
          total_invested_display?: number | null
          total_payouts_display?: number | null
          updated_at?: string
          usdt_address?: string
        }
        Update: {
          active_investors_display?: number | null
          id?: string
          qr_code_url?: string | null
          total_invested_display?: number | null
          total_payouts_display?: number | null
          updated_at?: string
          usdt_address?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          replied_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          replied_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          replied_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_audit_log: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
          tx_hash: string | null
          withdrawal_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
          tx_hash?: string | null
          withdrawal_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
          tx_hash?: string | null
          withdrawal_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          sent_at: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          tx_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_upline_chain: {
        Args: { _max_levels?: number; _user_id: string }
        Returns: {
          ancestor_id: string
          level: number
        }[]
      }
      get_user_downline: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          has_active: boolean
          invested: number
          level: number
          referred_by: string
          user_id: string
        }[]
      }
      get_user_id_by_referral_code: { Args: { _code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recompute_team_stats: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "investor"
      investment_status: "pending" | "confirmed" | "rejected" | "completed"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "referral_commission"
        | "daily_earning"
        | "mlm_commission"
      withdrawal_status:
        | "pending"
        | "approved"
        | "rejected"
        | "sent"
        | "confirmed"
        | "on_hold"
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
      app_role: ["admin", "investor"],
      investment_status: ["pending", "confirmed", "rejected", "completed"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "referral_commission",
        "daily_earning",
        "mlm_commission",
      ],
      withdrawal_status: [
        "pending",
        "approved",
        "rejected",
        "sent",
        "confirmed",
        "on_hold",
      ],
    },
  },
} as const
