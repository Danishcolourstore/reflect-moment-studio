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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      events: {
        Row: {
          allow_favorites_download: boolean
          allow_full_download: boolean
          cover_url: string | null
          created_at: string
          download_password: string | null
          download_requires_password: boolean
          download_resolution: string
          downloads_enabled: boolean
          event_date: string
          event_type: string
          face_recognition_enabled: boolean
          gallery_layout: string
          gallery_pin: string | null
          id: string
          is_published: boolean
          livesync_enabled: boolean
          location: string | null
          name: string
          photo_count: number
          selection_mode_enabled: boolean
          selection_token: string | null
          slug: string
          updated_at: string
          user_id: string
          views: number
          watermark_enabled: boolean
        }
        Insert: {
          allow_favorites_download?: boolean
          allow_full_download?: boolean
          cover_url?: string | null
          created_at?: string
          download_password?: string | null
          download_requires_password?: boolean
          download_resolution?: string
          downloads_enabled?: boolean
          event_date?: string
          event_type?: string
          face_recognition_enabled?: boolean
          gallery_layout?: string
          gallery_pin?: string | null
          id?: string
          is_published?: boolean
          livesync_enabled?: boolean
          location?: string | null
          name: string
          photo_count?: number
          selection_mode_enabled?: boolean
          selection_token?: string | null
          slug: string
          updated_at?: string
          user_id: string
          views?: number
          watermark_enabled?: boolean
        }
        Update: {
          allow_favorites_download?: boolean
          allow_full_download?: boolean
          cover_url?: string | null
          created_at?: string
          download_password?: string | null
          download_requires_password?: boolean
          download_resolution?: string
          downloads_enabled?: boolean
          event_date?: string
          event_type?: string
          face_recognition_enabled?: boolean
          gallery_layout?: string
          gallery_pin?: string | null
          id?: string
          is_published?: boolean
          livesync_enabled?: boolean
          location?: string | null
          name?: string
          photo_count?: number
          selection_mode_enabled?: boolean
          selection_token?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          views?: number
          watermark_enabled?: boolean
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          guest_session_id: string
          id: string
          photo_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_session_id: string
          id?: string
          photo_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_session_id?: string
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_guest_session_id_fkey"
            columns: ["guest_session_id"]
            isOneToOne: false
            referencedRelation: "guest_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_registrations: {
        Row: {
          created_at: string
          email: string
          event_id: string
          face_token: string
          guest_name: string
          id: string
          matched_photo_ids: string[] | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          face_token: string
          guest_name: string
          id?: string
          matched_photo_ids?: string[] | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          face_token?: string
          guest_name?: string
          id?: string
          matched_photo_ids?: string[] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_selection_photos: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          selection_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          selection_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          selection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_selection_photos_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_selection_photos_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "guest_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_selections: {
        Row: {
          created_at: string
          event_id: string
          guest_email: string
          guest_name: string
          id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_email: string
          guest_name: string
          id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_email?: string
          guest_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_sessions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          last_seen_at: string
          session_token: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          last_seen_at?: string
          session_token: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          last_seen_at?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          event_id: string
          file_name: string | null
          file_size: number | null
          id: string
          is_favorite: boolean
          section: string | null
          sort_order: number | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_favorite?: boolean
          section?: string | null
          sort_order?: number | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_favorite?: boolean
          section?: string | null
          sort_order?: number | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          mobile: string | null
          plan: string
          storage_limit_mb: number | null
          studio_name: string
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          plan?: string
          storage_limit_mb?: number | null
          studio_name?: string
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          plan?: string
          storage_limit_mb?: number | null
          studio_name?: string
          suspended?: boolean
          updated_at?: string
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
    }
    Enums: {
      app_role: "admin" | "photographer"
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
      app_role: ["admin", "photographer"],
    },
  },
} as const
