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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      menu_items: {
        Row: {
          category: Database["public"]["Enums"]["menu_category"]
          created_at: string
          description: string
          id: string
          image_url: string
          is_available: boolean
          is_best_seller: boolean
          name: string
          price: number
          toppings: Json
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["menu_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_available?: boolean
          is_best_seller?: boolean
          name: string
          price: number
          toppings?: Json
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["menu_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_available?: boolean
          is_best_seller?: boolean
          name?: string
          price?: number
          toppings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          image_url: string
          line_total: number
          menu_item_id: string | null
          name: string
          order_id: string
          quantity: number
          toppings: Json
          unit_price: number
        }
        Insert: {
          id?: string
          image_url?: string
          line_total: number
          menu_item_id?: string | null
          name: string
          order_id: string
          quantity: number
          toppings?: Json
          unit_price: number
        }
        Update: {
          id?: string
          image_url?: string
          line_total?: number
          menu_item_id?: string | null
          name?: string
          order_id?: string
          quantity?: number
          toppings?: Json
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          created_at: string
          customer_name: string
          delivery_fee: number
          id: string
          notes: string
          order_code: string
          order_type: Database["public"]["Enums"]["order_type"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          points_earned: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_number: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          id?: string
          notes?: string
          order_code?: string
          order_type: Database["public"]["Enums"]["order_type"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          points_earned?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_number?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          id?: string
          notes?: string
          order_code?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          points_earned?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_number?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string
          created_at: string
          full_name: string
          id: string
          phone: string
          points: number
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          full_name?: string
          id: string
          phone?: string
          points?: number
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          points?: number
          updated_at?: string
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
      place_order: {
        Args: {
          p_address?: string
          p_items: Json
          p_notes?: string
          p_order_type: Database["public"]["Enums"]["order_type"]
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_table_number?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      menu_category: "minuman" | "dessert" | "makanan"
      order_status: "menunggu" | "diproses" | "siap" | "selesai" | "dibatalkan"
      order_type: "dine_in" | "takeaway" | "delivery"
      payment_method: "qris" | "cash" | "transfer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      menu_category: ["minuman", "dessert", "makanan"],
      order_status: ["menunggu", "diproses", "siap", "selesai", "dibatalkan"],
      order_type: ["dine_in", "takeaway", "delivery"],
      payment_method: ["qris", "cash", "transfer"],
    },
  },
} as const
