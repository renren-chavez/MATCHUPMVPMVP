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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      booking_chats: {
        Row: {
          booking_id: string | null
          coach_id: string
          created_at: string
          expires_at: string
          id: string
          messages: Json
          session_id: string
        }
        Insert: {
          booking_id?: string | null
          coach_id: string
          created_at?: string
          expires_at?: string
          id?: string
          messages?: Json
          session_id?: string
        }
        Update: {
          booking_id?: string | null
          coach_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          messages?: Json
          session_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          athlete_email: string | null
          athlete_name: string
          athlete_notes: string | null
          athlete_phone: string
          booking_reference: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          coach_id: string
          created_at: string | null
          duration_hours: number
          id: string
          location: string
          notes: string | null
          payment_method: string | null
          refund_amount: number | null
          refund_status: string | null
          session_date: string
          session_time: string
          sport: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          athlete_email?: string | null
          athlete_name?: string
          athlete_notes?: string | null
          athlete_phone?: string
          booking_reference?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coach_id: string
          created_at?: string | null
          duration_hours?: number
          id?: string
          location: string
          notes?: string | null
          payment_method?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          session_date: string
          session_time: string
          sport: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          athlete_email?: string | null
          athlete_name?: string
          athlete_notes?: string | null
          athlete_phone?: string
          booking_reference?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coach_id?: string
          created_at?: string | null
          duration_hours?: number
          id?: string
          location?: string
          notes?: string | null
          payment_method?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          session_date?: string
          session_time?: string
          sport?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_blockings: {
        Row: {
          blocked_date: string
          coach_id: string
          created_at: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          blocked_date: string
          coach_id: string
          created_at?: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          blocked_date?: string
          coach_id?: string
          created_at?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          bio: string | null
          business_name: string | null
          cancellation_policy: string | null
          certifications: string[] | null
          coaching_hours: Json | null
          created_at: string | null
          hourly_rate: number
          id: string
          is_active: boolean | null
          locations: string[]
          sports_offered: string[]
          updated_at: string | null
          venue_details: Json | null
          years_of_experience: number | null
        }
        Insert: {
          bio?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          certifications?: string[] | null
          coaching_hours?: Json | null
          created_at?: string | null
          hourly_rate: number
          id: string
          is_active?: boolean | null
          locations: string[]
          sports_offered: string[]
          updated_at?: string | null
          venue_details?: Json | null
          years_of_experience?: number | null
        }
        Update: {
          bio?: string | null
          business_name?: string | null
          cancellation_policy?: string | null
          certifications?: string[] | null
          coaching_hours?: Json | null
          created_at?: string | null
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          locations?: string[]
          sports_offered?: string[]
          updated_at?: string | null
          venue_details?: Json | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_recurring_blockings: {
        Row: {
          coach_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          dispute_initiated_at: string | null
          dispute_reason: string | null
          id: string
          is_deposit: boolean | null
          notes: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_receipt_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          reference_number: string | null
          refund_amount: number | null
          refund_date: string | null
          refund_notes: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          dispute_initiated_at?: string | null
          dispute_reason?: string | null
          id?: string
          is_deposit?: boolean | null
          notes?: string | null
          payment_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_receipt_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          reference_number?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          dispute_initiated_at?: string | null
          dispute_reason?: string | null
          id?: string
          is_deposit?: boolean | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_receipt_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          reference_number?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_booking_chats: { Args: never; Returns: undefined }
      format_philippine_phone: { Args: { phone: string }; Returns: string }
      generate_booking_reference: { Args: never; Returns: string }
      get_coach_public_info: { Args: { coach_uuid: string }; Returns: Json }
      validate_philippine_phone: { Args: { phone: string }; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
      payment_method: "gcash" | "maya" | "cash"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      user_type: "coach" | "athlete"
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
      booking_status: [
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      payment_method: ["gcash", "maya", "cash"],
      payment_status: ["pending", "paid", "refunded", "failed"],
      user_type: ["coach", "athlete"],
    },
  },
} as const
