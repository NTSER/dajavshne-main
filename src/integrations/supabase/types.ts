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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string | null
          guest_count: number
          id: string
          service_id: string | null
          special_requests: string | null
          status: string | null
          status_updated_at: string | null
          total_price: number
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string | null
          guest_count?: number
          id?: string
          service_id?: string | null
          special_requests?: string | null
          status?: string | null
          status_updated_at?: string | null
          total_price: number
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string | null
          guest_count?: number
          id?: string
          service_id?: string | null
          special_requests?: string | null
          status?: string | null
          status_updated_at?: string | null
          total_price?: number
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "venue_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          scheduled_for: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          scheduled_for?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          scheduled_for?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
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
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string
          venue_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id: string
          venue_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
          venue_id?: string
        }
        Relationships: []
      }
      saved_payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          id: string
          is_default: boolean
          stripe_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      venue_discounts: {
        Row: {
          active: boolean
          buy_quantity: number | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          get_quantity: number | null
          id: string
          title: string
          updated_at: string
          valid_days: string[] | null
          valid_end_time: string | null
          valid_start_time: string | null
          venue_id: string
        }
        Insert: {
          active?: boolean
          buy_quantity?: number | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          get_quantity?: number | null
          id?: string
          title: string
          updated_at?: string
          valid_days?: string[] | null
          valid_end_time?: string | null
          valid_start_time?: string | null
          venue_id: string
        }
        Update: {
          active?: boolean
          buy_quantity?: number | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          get_quantity?: number | null
          id?: string
          title?: string
          updated_at?: string
          valid_days?: string[] | null
          valid_end_time?: string | null
          valid_start_time?: string | null
          venue_id?: string
        }
        Relationships: []
      }
      venue_games: {
        Row: {
          created_at: string
          game_id: string
          id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_services: {
        Row: {
          created_at: string | null
          id: string
          images: string[] | null
          name: string
          price: number
          service_type: Database["public"]["Enums"]["service_type"] | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          images?: string[] | null
          name: string
          price: number
          service_type?: Database["public"]["Enums"]["service_type"] | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          images?: string[] | null
          name?: string
          price?: number
          service_type?: Database["public"]["Enums"]["service_type"] | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_services_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          approval_status: string | null
          closing_time: string | null
          created_at: string | null
          default_discount_percentage: number | null
          id: string
          images: string[] | null
          is_visible: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          opening_time: string | null
          partner_id: string | null
          priority: number | null
          rating: number | null
          rejected_reason: string | null
          review_count: number | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          closing_time?: string | null
          created_at?: string | null
          default_discount_percentage?: number | null
          id?: string
          images?: string[] | null
          is_visible?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          opening_time?: string | null
          partner_id?: string | null
          priority?: number | null
          rating?: number | null
          rejected_reason?: string | null
          review_count?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          closing_time?: string | null
          created_at?: string | null
          default_discount_percentage?: number | null
          id?: string
          images?: string[] | null
          is_visible?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          opening_time?: string | null
          partner_id?: string | null
          priority?: number | null
          rating?: number | null
          rejected_reason?: string | null
          review_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      service_type: "PC Gaming" | "PlayStation 5" | "Billiards" | "Table Tennis"
      user_role: "customer" | "partner" | "admin"
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
      service_type: ["PC Gaming", "PlayStation 5", "Billiards", "Table Tennis"],
      user_role: ["customer", "partner", "admin"],
    },
  },
} as const
