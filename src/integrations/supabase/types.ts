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
      admin_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          target: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by?: string
          target?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          target?: string | null
        }
        Relationships: []
      }
      admin_pin_attempts: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          ip_hint: string | null
          locked_at: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_hint?: string | null
          locked_at?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_hint?: string | null
          locked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_developer_prompts: {
        Row: {
          applied_at: string | null
          created_at: string
          file_changes: Json | null
          generated_code: string | null
          id: string
          prompt: string
          rollback_snapshot: Json | null
          rolled_back_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          file_changes?: Json | null
          generated_code?: string | null
          id?: string
          prompt: string
          rollback_snapshot?: Json | null
          rolled_back_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          file_changes?: Json | null
          generated_code?: string | null
          id?: string
          prompt?: string
          rollback_snapshot?: Json | null
          rolled_back_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_reply_drafts: {
        Row: {
          availability_context: Json | null
          channel: string
          created_at: string
          draft_reply: string
          id: string
          lead_id: string | null
          lead_message: string | null
          lead_name: string
          pricing_context: Json | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          availability_context?: Json | null
          channel?: string
          created_at?: string
          draft_reply: string
          id?: string
          lead_id?: string | null
          lead_message?: string | null
          lead_name: string
          pricing_context?: Json | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          availability_context?: Json | null
          channel?: string
          created_at?: string
          draft_reply?: string
          id?: string
          lead_id?: string | null
          lead_message?: string | null
          lead_name?: string
          pricing_context?: Json | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      album_layers: {
        Row: {
          created_at: string
          height: number
          id: string
          layer_type: string
          page_id: string
          photo_id: string | null
          rotation: number
          settings_json: Json | null
          text_content: string | null
          width: number
          x: number
          y: number
          z_index: number
        }
        Insert: {
          created_at?: string
          height?: number
          id?: string
          layer_type?: string
          page_id: string
          photo_id?: string | null
          rotation?: number
          settings_json?: Json | null
          text_content?: string | null
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          created_at?: string
          height?: number
          id?: string
          layer_type?: string
          page_id?: string
          photo_id?: string | null
          rotation?: number
          settings_json?: Json | null
          text_content?: string | null
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "album_layers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "album_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_layers_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      album_pages: {
        Row: {
          album_id: string
          background_color: string | null
          created_at: string
          id: string
          page_number: number
          paper_texture: string | null
          spread_index: number
        }
        Insert: {
          album_id: string
          background_color?: string | null
          created_at?: string
          id?: string
          page_number?: number
          paper_texture?: string | null
          spread_index?: number
        }
        Update: {
          album_id?: string
          background_color?: string | null
          created_at?: string
          id?: string
          page_number?: number
          paper_texture?: string | null
          spread_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "album_pages_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      album_selections: {
        Row: {
          created_at: string
          event_id: string
          guest_session_id: string | null
          id: string
          photo_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_session_id?: string | null
          id?: string
          photo_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_session_id?: string | null
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_selections_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          cover_type: string
          created_at: string
          event_id: string | null
          id: string
          leaf_count: number
          name: string
          page_count: number
          share_token: string | null
          size: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_type?: string
          created_at?: string
          event_id?: string | null
          id?: string
          leaf_count?: number
          name?: string
          page_count?: number
          share_token?: string | null
          size?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_type?: string
          created_at?: string
          event_id?: string | null
          id?: string
          leaf_count?: number
          name?: string
          page_count?: number
          share_token?: string | null
          size?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          page: string
          screenshot_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page: string
          screenshot_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page?: string
          screenshot_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string | null
          cover_url: string | null
          created_at: string
          id: string
          published: boolean | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          advance_paid: number
          amount: number
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          event_date: string | null
          event_type: string
          id: string
          lead_id: string | null
          notes: string | null
          package_id: string | null
          photographer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          advance_paid?: number
          amount?: number
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          event_date?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          package_id?: string | null
          photographer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          advance_paid?: number
          amount?: number
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          event_date?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          package_id?: string | null
          photographer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          browser: string | null
          conversation_id: string | null
          created_at: string
          description: string
          device_type: string | null
          id: string
          os: string | null
          page_context: string
          screen_resolution: string | null
          screenshot_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          conversation_id?: string | null
          created_at?: string
          description: string
          device_type?: string | null
          id?: string
          os?: string | null
          page_context: string
          screen_resolution?: string | null
          screenshot_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          browser?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string
          device_type?: string | null
          id?: string
          os?: string | null
          page_context?: string
          screen_resolution?: string | null
          screenshot_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "entiran_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_emails: {
        Row: {
          id: string
          message: string | null
          recipients_count: number
          sent_at: string
          subject: string
          target: string
        }
        Insert: {
          id?: string
          message?: string | null
          recipients_count?: number
          sent_at?: string
          subject: string
          target: string
        }
        Update: {
          id?: string
          message?: string | null
          recipients_count?: number
          sent_at?: string
          subject?: string
          target?: string
        }
        Relationships: []
      }
      business_health_scores: {
        Row: {
          conversion_avg: number
          conversion_rate: number
          created_at: string
          gallery_views: number
          gallery_views_change: number
          id: string
          insights: Json | null
          lead_volume: number
          lead_volume_change: number
          overall_score: number
          response_time_hrs: number
          revenue_confirmed_cents: number
          revenue_forecast_cents: number
          user_id: string
          week_start: string
        }
        Insert: {
          conversion_avg?: number
          conversion_rate?: number
          created_at?: string
          gallery_views?: number
          gallery_views_change?: number
          id?: string
          insights?: Json | null
          lead_volume?: number
          lead_volume_change?: number
          overall_score?: number
          response_time_hrs?: number
          revenue_confirmed_cents?: number
          revenue_forecast_cents?: number
          user_id: string
          week_start: string
        }
        Update: {
          conversion_avg?: number
          conversion_rate?: number
          created_at?: string
          gallery_views?: number
          gallery_views_change?: number
          id?: string
          insights?: Json | null
          lead_volume?: number
          lead_volume_change?: number
          overall_score?: number
          response_time_hrs?: number
          revenue_confirmed_cents?: number
          revenue_forecast_cents?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      chapter_photos: {
        Row: {
          chapter_id: string
          id: string
          photo_id: string
          sort_order: number | null
        }
        Insert: {
          chapter_id: string
          id?: string
          photo_id: string
          sort_order?: number | null
        }
        Update: {
          chapter_id?: string
          id?: string
          photo_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_photos_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "gallery_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_photos_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      cheetah_photos: {
        Row: {
          ai_recommendation: string | null
          ai_score: number | null
          ai_status: string
          burst_group: string | null
          captured_at: string | null
          composition: number | null
          created_at: string
          cull_status: string
          event_id: string | null
          exposure: string | null
          eyes_open: boolean | null
          file_name: string
          file_size: number | null
          id: string
          is_best_in_burst: boolean | null
          original_url: string
          preview_url: string | null
          processed_at: string | null
          session_id: string
          sharpness: number | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          ai_recommendation?: string | null
          ai_score?: number | null
          ai_status?: string
          burst_group?: string | null
          captured_at?: string | null
          composition?: number | null
          created_at?: string
          cull_status?: string
          event_id?: string | null
          exposure?: string | null
          eyes_open?: boolean | null
          file_name: string
          file_size?: number | null
          id?: string
          is_best_in_burst?: boolean | null
          original_url: string
          preview_url?: string | null
          processed_at?: string | null
          session_id: string
          sharpness?: number | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          ai_recommendation?: string | null
          ai_score?: number | null
          ai_status?: string
          burst_group?: string | null
          captured_at?: string | null
          composition?: number | null
          created_at?: string
          cull_status?: string
          event_id?: string | null
          exposure?: string | null
          eyes_open?: boolean | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_best_in_burst?: boolean | null
          original_url?: string
          preview_url?: string | null
          processed_at?: string | null
          session_id?: string
          sharpness?: number | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cheetah_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheetah_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheetah_photos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cheetah_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cheetah_sessions: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          status: string
          title: string
          total_photos: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          status?: string
          title?: string
          total_photos?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          status?: string
          title?: string
          total_photos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cheetah_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheetah_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      client_downloads: {
        Row: {
          client_id: string
          downloaded_at: string
          id: string
          photo_id: string
        }
        Insert: {
          client_id: string
          downloaded_at?: string
          id?: string
          photo_id: string
        }
        Update: {
          client_id?: string
          downloaded_at?: string
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_downloads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_downloads_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      client_events: {
        Row: {
          access_level: string
          client_id: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          access_level?: string
          client_id: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          access_level?: string
          client_id?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      client_favorites: {
        Row: {
          client_id: string
          created_at: string
          id: string
          photo_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          photo_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_favorites_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      client_milestones: {
        Row: {
          client_id: string
          created_at: string
          id: string
          milestone_date: string
          milestone_type: string
          notes: string | null
          partner_name: string | null
          photographer_id: string
          recurring: boolean
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          milestone_date: string
          milestone_type?: string
          notes?: string | null
          partner_name?: string | null
          photographer_id: string
          recurring?: boolean
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          milestone_date?: string
          milestone_type?: string
          notes?: string | null
          partner_name?: string | null
          photographer_id?: string
          recurring?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_milestones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reminders: {
        Row: {
          action_data: Json | null
          action_type: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          due_date: string
          id: string
          message: string | null
          milestone_id: string | null
          photographer_id: string
          reminder_type: string
          status: string
          title: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          due_date: string
          id?: string
          message?: string | null
          milestone_id?: string | null
          photographer_id: string
          reminder_type?: string
          status?: string
          title: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          message?: string | null
          milestone_id?: string | null
          photographer_id?: string
          reminder_type?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reminders_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "client_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      client_timeline: {
        Row: {
          client_id: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
          photographer_id: string
          title: string
        }
        Insert: {
          client_id: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          photographer_id: string
          title: string
        }
        Update: {
          client_id?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          photographer_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string
          event_id: string | null
          id: string
          name: string
          phone: string | null
          photographer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id?: string | null
          id?: string
          name: string
          phone?: string | null
          photographer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          photographer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          item_data: Json | null
          item_id: string
          item_image: string | null
          item_title: string | null
          item_type: string
          sort_order: number
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id: string
          item_image?: string | null
          item_title?: string | null
          item_type?: string
          sort_order?: number
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id?: string
          item_image?: string | null
          item_title?: string | null
          item_type?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_test: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          event_type: string | null
          id: string
          message: string
          name: string
          phone: string | null
          photographer_id: string
        }
        Insert: {
          created_at?: string
          email: string
          event_type?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          photographer_id: string
        }
        Update: {
          created_at?: string
          email?: string
          event_type?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          photographer_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          event_date: string | null
          event_type: string | null
          id: string
          message: string
          name: string
          phone: string | null
          referral_source: string | null
          site_owner_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          referral_source?: string | null
          site_owner_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          referral_source?: string | null
          site_owner_id?: string
        }
        Relationships: []
      }
      culled_photos: {
        Row: {
          composition: number | null
          created_at: string | null
          duplicate_risk: boolean | null
          exposure: number | null
          eyes_open: boolean | null
          filename: string
          id: string
          rating: string
          reason: string | null
          session_id: string | null
          sharpness: number | null
          url: string | null
        }
        Insert: {
          composition?: number | null
          created_at?: string | null
          duplicate_risk?: boolean | null
          exposure?: number | null
          eyes_open?: boolean | null
          filename: string
          id?: string
          rating?: string
          reason?: string | null
          session_id?: string | null
          sharpness?: number | null
          url?: string | null
        }
        Update: {
          composition?: number | null
          created_at?: string | null
          duplicate_risk?: boolean | null
          exposure?: number | null
          eyes_open?: boolean | null
          filename?: string
          id?: string
          rating?: string
          reason?: string | null
          session_id?: string | null
          sharpness?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "culled_photos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "culling_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      culling_sessions: {
        Row: {
          best_count: number | null
          created_at: string | null
          event_id: string | null
          id: string
          maybe_count: number | null
          reject_count: number | null
          total_photos: number | null
          user_id: string
        }
        Insert: {
          best_count?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          maybe_count?: number | null
          reject_count?: number | null
          total_photos?: number | null
          user_id: string
        }
        Update: {
          best_count?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          maybe_count?: number | null
          reject_count?: number | null
          total_photos?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "culling_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culling_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          layout_config: Json
          layout_name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          layout_config?: Json
          layout_name?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          layout_config?: Json
          layout_name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_modules: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          module_description: string | null
          module_key: string
          module_name: string
          roles: string[] | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_description?: string | null
          module_key: string
          module_name: string
          roles?: string[] | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_description?: string | null
          module_key?: string
          module_name?: string
          roles?: string[] | null
          sort_order?: number
        }
        Relationships: []
      }
      dashboard_navigation: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          nav_icon: string
          nav_key: string
          nav_label: string
          nav_route: string
          parent_id: string | null
          roles: string[] | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          nav_icon?: string
          nav_key: string
          nav_label: string
          nav_route: string
          parent_id?: string | null
          roles?: string[] | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          nav_icon?: string
          nav_key?: string
          nav_label?: string
          nav_route?: string
          parent_id?: string | null
          roles?: string[] | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_navigation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "dashboard_navigation"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_quick_actions: {
        Row: {
          action_icon: string
          action_key: string
          action_label: string
          action_route: string | null
          action_type: string
          created_at: string
          id: string
          is_visible: boolean
          roles: string[] | null
          sort_order: number
        }
        Insert: {
          action_icon?: string
          action_key: string
          action_label: string
          action_route?: string | null
          action_type?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          roles?: string[] | null
          sort_order?: number
        }
        Update: {
          action_icon?: string
          action_key?: string
          action_label?: string
          action_route?: string | null
          action_type?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          roles?: string[] | null
          sort_order?: number
        }
        Relationships: []
      }
      dashboard_settings: {
        Row: {
          category: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          category?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          created_at: string
          default_height: number
          default_width: number
          id: string
          is_active: boolean
          min_height: number | null
          min_width: number | null
          sort_order: number
          widget_description: string | null
          widget_icon: string | null
          widget_key: string
          widget_name: string
        }
        Insert: {
          created_at?: string
          default_height?: number
          default_width?: number
          id?: string
          is_active?: boolean
          min_height?: number | null
          min_width?: number | null
          sort_order?: number
          widget_description?: string | null
          widget_icon?: string | null
          widget_key: string
          widget_name: string
        }
        Update: {
          created_at?: string
          default_height?: number
          default_width?: number
          id?: string
          is_active?: boolean
          min_height?: number | null
          min_width?: number | null
          sort_order?: number
          widget_description?: string | null
          widget_icon?: string | null
          widget_key?: string
          widget_name?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          id: string
          is_primary: boolean | null
          subdomain: string
          updated_at: string | null
          user_id: string
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          is_primary?: boolean | null
          subdomain: string
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          is_primary?: boolean | null
          subdomain?: string
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      entiran_conversations: {
        Row: {
          created_at: string
          id: string
          page_context: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_context: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_context?: string
          user_id?: string
        }
        Relationships: []
      }
      entiran_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "entiran_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "entiran_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_analytics: {
        Row: {
          downloads_count: number
          event_id: string
          favorites_count: number
          gallery_views: number
          id: string
          updated_at: string
        }
        Insert: {
          downloads_count?: number
          event_id: string
          favorites_count?: number
          gallery_views?: number
          id?: string
          updated_at?: string
        }
        Update: {
          downloads_count?: number
          event_id?: string
          favorites_count?: number
          gallery_views?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_qr_access: {
        Row: {
          created_at: string | null
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          public_token: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          public_token?: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          public_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_qr_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_qr_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_views: {
        Row: {
          event_id: string
          guest_session_id: string | null
          id: string
          viewed_at: string
        }
        Insert: {
          event_id: string
          guest_session_id?: string | null
          id?: string
          viewed_at?: string
        }
        Update: {
          event_id?: string
          guest_session_id?: string | null
          id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
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
          feed_visible: boolean
          gallery_layout: string
          gallery_password: string | null
          gallery_pin: string | null
          gallery_style: string
          guest_face_enabled: boolean | null
          hero_button_label: string | null
          hero_couple_name: string | null
          hero_subtitle: string | null
          id: string
          is_archived: boolean
          is_published: boolean
          livesync_enabled: boolean
          location: string | null
          name: string
          photo_count: number
          qr_enabled: boolean | null
          qr_token: string | null
          selection_mode_enabled: boolean
          selection_token: string | null
          slug: string
          updated_at: string
          user_id: string
          views: number
          watermark_enabled: boolean
          website_template: string | null
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
          feed_visible?: boolean
          gallery_layout?: string
          gallery_password?: string | null
          gallery_pin?: string | null
          gallery_style?: string
          guest_face_enabled?: boolean | null
          hero_button_label?: string | null
          hero_couple_name?: string | null
          hero_subtitle?: string | null
          id?: string
          is_archived?: boolean
          is_published?: boolean
          livesync_enabled?: boolean
          location?: string | null
          name: string
          photo_count?: number
          qr_enabled?: boolean | null
          qr_token?: string | null
          selection_mode_enabled?: boolean
          selection_token?: string | null
          slug: string
          updated_at?: string
          user_id: string
          views?: number
          watermark_enabled?: boolean
          website_template?: string | null
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
          feed_visible?: boolean
          gallery_layout?: string
          gallery_password?: string | null
          gallery_pin?: string | null
          gallery_style?: string
          guest_face_enabled?: boolean | null
          hero_button_label?: string | null
          hero_couple_name?: string | null
          hero_subtitle?: string | null
          id?: string
          is_archived?: boolean
          is_published?: boolean
          livesync_enabled?: boolean
          location?: string | null
          name?: string
          photo_count?: number
          qr_enabled?: boolean | null
          qr_token?: string | null
          selection_mode_enabled?: boolean
          selection_token?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          views?: number
          watermark_enabled?: boolean
          website_template?: string | null
        }
        Relationships: []
      }
      face_indexing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          event_id: string
          faces_found: number | null
          id: string
          photos_processed: number | null
          photos_total: number | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_id: string
          faces_found?: number | null
          id?: string
          photos_processed?: number | null
          photos_total?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          faces_found?: number | null
          id?: string
          photos_processed?: number | null
          photos_total?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "face_indexing_jobs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_indexing_jobs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
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
      follow_up_rules: {
        Row: {
          auto_send: boolean
          created_at: string
          id: string
          is_active: boolean
          photographer_id: string
          rule_type: string
          template_id: string | null
          trigger_days: number
        }
        Insert: {
          auto_send?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          photographer_id: string
          rule_type: string
          template_id?: string | null
          trigger_days?: number
        }
        Update: {
          auto_send?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          photographer_id?: string
          rule_type?: string
          template_id?: string | null
          trigger_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_chapters: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_chapters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_chapters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_text_blocks: {
        Row: {
          bg_style: string | null
          created_at: string
          event_id: string
          font_family: string | null
          font_size: string | null
          font_weight: string | null
          id: string
          letter_spacing: string | null
          line_height: string | null
          paragraph: string | null
          sort_order: number
          subtitle: string | null
          template: string | null
          text_align: string | null
          text_color: string | null
          title: string | null
        }
        Insert: {
          bg_style?: string | null
          created_at?: string
          event_id: string
          font_family?: string | null
          font_size?: string | null
          font_weight?: string | null
          id?: string
          letter_spacing?: string | null
          line_height?: string | null
          paragraph?: string | null
          sort_order?: number
          subtitle?: string | null
          template?: string | null
          text_align?: string | null
          text_color?: string | null
          title?: string | null
        }
        Update: {
          bg_style?: string | null
          created_at?: string
          event_id?: string
          font_family?: string | null
          font_size?: string | null
          font_weight?: string | null
          id?: string
          letter_spacing?: string | null
          line_height?: string | null
          paragraph?: string | null
          sort_order?: number
          subtitle?: string | null
          template?: string | null
          text_align?: string | null
          text_color?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_text_blocks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_text_blocks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_templates: {
        Row: {
          background_color: string
          border_radius: number
          category: string
          columns: number
          created_at: string
          frame_style: string | null
          grid_type: string
          id: string
          is_active: boolean
          layout_config: Json
          name: string
          padding: number
          preview_image_url: string | null
          rows: number
          sort_order: number
          spacing: number
          updated_at: string
        }
        Insert: {
          background_color?: string
          border_radius?: number
          category?: string
          columns?: number
          created_at?: string
          frame_style?: string | null
          grid_type?: string
          id?: string
          is_active?: boolean
          layout_config?: Json
          name: string
          padding?: number
          preview_image_url?: string | null
          rows?: number
          sort_order?: number
          spacing?: number
          updated_at?: string
        }
        Update: {
          background_color?: string
          border_radius?: number
          category?: string
          columns?: number
          created_at?: string
          frame_style?: string | null
          grid_type?: string
          id?: string
          is_active?: boolean
          layout_config?: Json
          name?: string
          padding?: number
          preview_image_url?: string | null
          rows?: number
          sort_order?: number
          spacing?: number
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "guest_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
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
          {
            foreignKeyName: "guest_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_selfies: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          image_url: string
          match_results: Json | null
          processing_status: string | null
          qr_access_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          image_url: string
          match_results?: Json | null
          processing_status?: string | null
          qr_access_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          image_url?: string
          match_results?: Json | null
          processing_status?: string | null
          qr_access_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_selfies_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_selfies_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_selfies_qr_access_id_fkey"
            columns: ["qr_access_id"]
            isOneToOne: false
            referencedRelation: "event_qr_access"
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
          {
            foreignKeyName: "guest_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_competitors: {
        Row: {
          avg_comments: number
          avg_likes: number
          content_focus: string | null
          created_at: string
          display_name: string | null
          followers: number
          id: string
          last_updated: string
          photographer_id: string
          posts_per_week: number
          reels_percentage: number
          username: string
        }
        Insert: {
          avg_comments?: number
          avg_likes?: number
          content_focus?: string | null
          created_at?: string
          display_name?: string | null
          followers?: number
          id?: string
          last_updated?: string
          photographer_id: string
          posts_per_week?: number
          reels_percentage?: number
          username: string
        }
        Update: {
          avg_comments?: number
          avg_likes?: number
          content_focus?: string | null
          created_at?: string
          display_name?: string | null
          followers?: number
          id?: string
          last_updated?: string
          photographer_id?: string
          posts_per_week?: number
          reels_percentage?: number
          username?: string
        }
        Relationships: []
      }
      instagram_snapshots: {
        Row: {
          comments: number
          created_at: string
          followers: number
          followers_gained: number
          id: string
          likes: number
          link_clicks: number
          notes: string | null
          period: string
          photographer_id: string
          posts_count: number
          profile_visits: number
          reach: number
          reels_count: number
          saves: number
          shares: number
          snapshot_date: string
          stories_count: number
        }
        Insert: {
          comments?: number
          created_at?: string
          followers?: number
          followers_gained?: number
          id?: string
          likes?: number
          link_clicks?: number
          notes?: string | null
          period?: string
          photographer_id: string
          posts_count?: number
          profile_visits?: number
          reach?: number
          reels_count?: number
          saves?: number
          shares?: number
          snapshot_date?: string
          stories_count?: number
        }
        Update: {
          comments?: number
          created_at?: string
          followers?: number
          followers_gained?: number
          id?: string
          likes?: number
          link_clicks?: number
          notes?: string | null
          period?: string
          photographer_id?: string
          posts_count?: number
          profile_visits?: number
          reach?: number
          reels_count?: number
          saves?: number
          shares?: number
          snapshot_date?: string
          stories_count?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          photographer_id: string
          source_event_id: string | null
          source_event_name: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          photographer_id: string
          source_event_id?: string | null
          source_event_name?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          photographer_id?: string
          source_event_id?: string | null
          source_event_name?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          message_body: string
          photographer_id: string
          template_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          message_body: string
          photographer_id: string
          template_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          message_body?: string
          photographer_id?: string
          template_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mood_board_drops: {
        Row: {
          color_palette: string[] | null
          cover_image: string | null
          created_at: string
          id: string
          is_published: boolean
          lighting_tip: string | null
          pose_suggestion: string | null
          recommended_preset_id: string | null
          reference_images: Json | null
          subtitle: string | null
          theme: string
          title: string
          week_number: number
          year: number
        }
        Insert: {
          color_palette?: string[] | null
          cover_image?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          lighting_tip?: string | null
          pose_suggestion?: string | null
          recommended_preset_id?: string | null
          reference_images?: Json | null
          subtitle?: string | null
          theme: string
          title: string
          week_number: number
          year: number
        }
        Update: {
          color_palette?: string[] | null
          cover_image?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          lighting_tip?: string | null
          pose_suggestion?: string | null
          recommended_preset_id?: string | null
          reference_images?: Json | null
          subtitle?: string | null
          theme?: string
          title?: string
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "mood_board_drops_recommended_preset_id_fkey"
            columns: ["recommended_preset_id"]
            isOneToOne: false
            referencedRelation: "preset_marketplace"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          is_read: boolean
          message: string
          photo_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          photo_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          photo_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          add_ons: Json
          created_at: string
          currency: string
          deliverables: Json
          id: string
          is_active: boolean
          name: string
          photographer_id: string
          price: number
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          add_ons?: Json
          created_at?: string
          currency?: string
          deliverables?: Json
          id?: string
          is_active?: boolean
          name: string
          photographer_id: string
          price?: number
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Update: {
          add_ons?: Json
          created_at?: string
          currency?: string
          deliverables?: Json
          id?: string
          is_active?: boolean
          name?: string
          photographer_id?: string
          price?: number
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_comments: {
        Row: {
          comment: string
          created_at: string
          event_id: string
          guest_name: string | null
          guest_session_id: string | null
          id: string
          photo_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          event_id: string
          guest_name?: string | null
          guest_session_id?: string | null
          id?: string
          photo_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          event_id?: string
          guest_name?: string | null
          guest_session_id?: string | null
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_faces: {
        Row: {
          azure_face_id: string | null
          confidence: number | null
          created_at: string | null
          embedding: Json | null
          event_id: string
          face_rectangle: Json | null
          id: string
          indexed_at: string | null
          person_cluster: string | null
          photo_id: string
        }
        Insert: {
          azure_face_id?: string | null
          confidence?: number | null
          created_at?: string | null
          embedding?: Json | null
          event_id: string
          face_rectangle?: Json | null
          id?: string
          indexed_at?: string | null
          person_cluster?: string | null
          photo_id: string
        }
        Update: {
          azure_face_id?: string | null
          confidence?: number | null
          created_at?: string | null
          embedding?: Json | null
          event_id?: string
          face_rectangle?: Json | null
          id?: string
          indexed_at?: string | null
          person_cluster?: string | null
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_faces_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_faces_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_faces_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_interactions: {
        Row: {
          created_at: string
          event_id: string
          guest_session_id: string | null
          id: string
          interaction_type: string | null
          photo_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_session_id?: string | null
          id?: string
          interaction_type?: string | null
          photo_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_session_id?: string | null
          id?: string
          interaction_type?: string | null
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_interactions_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_spotlights: {
        Row: {
          booking_url: string | null
          created_at: string
          gallery_url: string | null
          id: string
          instagram_handle: string | null
          is_published: boolean
          packages: Json | null
          photographer_id: string | null
          photographer_name: string
          portrait_url: string | null
          showcase_images: string[] | null
          specialties: string[] | null
          story: string
          style_description: string | null
          tagline: string | null
          website_url: string | null
          week_number: number
          year: number
        }
        Insert: {
          booking_url?: string | null
          created_at?: string
          gallery_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_published?: boolean
          packages?: Json | null
          photographer_id?: string | null
          photographer_name: string
          portrait_url?: string | null
          showcase_images?: string[] | null
          specialties?: string[] | null
          story: string
          style_description?: string | null
          tagline?: string | null
          website_url?: string | null
          week_number: number
          year: number
        }
        Update: {
          booking_url?: string | null
          created_at?: string
          gallery_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_published?: boolean
          packages?: Json | null
          photographer_id?: string | null
          photographer_name?: string
          portrait_url?: string | null
          showcase_images?: string[] | null
          specialties?: string[] | null
          story?: string
          style_description?: string | null
          tagline?: string | null
          website_url?: string | null
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      photographer_websites: {
        Row: {
          about_bio: string | null
          accent_color: string | null
          build_status: string | null
          city: string
          created_at: string
          custom_domain: string | null
          email: string | null
          id: string
          is_published: boolean | null
          phone: string | null
          selected_photos: Json | null
          seo_data: Json | null
          specialty: string
          studio_name: string
          subdomain: string | null
          tagline: string | null
          theme_mode: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          about_bio?: string | null
          accent_color?: string | null
          build_status?: string | null
          city?: string
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          is_published?: boolean | null
          phone?: string | null
          selected_photos?: Json | null
          seo_data?: Json | null
          specialty?: string
          studio_name?: string
          subdomain?: string | null
          tagline?: string | null
          theme_mode?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          about_bio?: string | null
          accent_color?: string | null
          build_status?: string | null
          city?: string
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          is_published?: boolean | null
          phone?: string | null
          selected_photos?: Json | null
          seo_data?: Json | null
          specialty?: string
          studio_name?: string
          subdomain?: string | null
          tagline?: string | null
          theme_mode?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_features: {
        Row: {
          allowed_roles: string[] | null
          created_at: string
          feature_description: string | null
          feature_icon: string | null
          feature_key: string
          feature_name: string
          feature_route: string | null
          feature_type: string
          id: string
          is_enabled: boolean
          is_premium: boolean
          settings_json: Json | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[] | null
          created_at?: string
          feature_description?: string | null
          feature_icon?: string | null
          feature_key: string
          feature_name: string
          feature_route?: string | null
          feature_type?: string
          id?: string
          is_enabled?: boolean
          is_premium?: boolean
          settings_json?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[] | null
          created_at?: string
          feature_description?: string | null
          feature_icon?: string | null
          feature_key?: string
          feature_name?: string
          feature_route?: string | null
          feature_type?: string
          id?: string
          is_enabled?: boolean
          is_premium?: boolean
          settings_json?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_layouts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          layout_config: Json
          layout_name: string
          layout_type: string
          page_key: string
          responsive_config: Json | null
          target_roles: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          layout_config?: Json
          layout_name?: string
          layout_type?: string
          page_key: string
          responsive_config?: Json | null
          target_roles?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          layout_config?: Json
          layout_name?: string
          layout_type?: string
          page_key?: string
          responsive_config?: Json | null
          target_roles?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          custom_permissions: Json | null
          feature_key: string
          id: string
          role: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          custom_permissions?: Json | null
          feature_key: string
          id?: string
          role: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          custom_permissions?: Json | null
          feature_key?: string
          id?: string
          role?: string
        }
        Relationships: []
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
      platform_ui_settings: {
        Row: {
          description: string | null
          id: string
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          setting_category: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          setting_category?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_albums: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_visible: boolean | null
          photo_urls: string[] | null
          sort_order: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean | null
          photo_urls?: string[] | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean | null
          photo_urls?: string[] | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      preset_marketplace: {
        Row: {
          before_after_pairs: Json | null
          category: string
          created_at: string
          currency: string
          description: string | null
          download_count: number
          download_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          preview_images: string[] | null
          price_cents: number
          rating_avg: number | null
          rating_count: number
          seller_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          before_after_pairs?: Json | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          download_count?: number
          download_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          preview_images?: string[] | null
          price_cents?: number
          rating_avg?: number | null
          rating_count?: number
          seller_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          before_after_pairs?: Json | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          download_count?: number
          download_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          preview_images?: string[] | null
          price_cents?: number
          rating_avg?: number | null
          rating_count?: number
          seller_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      preset_purchases: {
        Row: {
          amount_cents: number
          id: string
          preset_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          id?: string
          preset_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          id?: string
          preset_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_purchases_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "preset_marketplace"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_intelligence: {
        Row: {
          category: string
          city: string | null
          generated_at: string
          id: string
          insight: string | null
          local_avg_cents: number
          local_median_cents: number
          percentile_rank: number
          sample_size: number
          trend: string | null
          user_id: string
          user_price_cents: number
        }
        Insert: {
          category?: string
          city?: string | null
          generated_at?: string
          id?: string
          insight?: string | null
          local_avg_cents?: number
          local_median_cents?: number
          percentile_rank?: number
          sample_size?: number
          trend?: string | null
          user_id: string
          user_price_cents?: number
        }
        Update: {
          category?: string
          city?: string | null
          generated_at?: string
          id?: string
          insight?: string | null
          local_avg_cents?: number
          local_median_cents?: number
          percentile_rank?: number
          sample_size?: number
          trend?: string | null
          user_id?: string
          user_price_cents?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accent_preference: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          force_logout_requested: boolean
          id: string
          mobile: string | null
          onboarding_completed: boolean
          plan: string
          storage_limit_mb: number | null
          studio_accent_color: string | null
          studio_logo_url: string | null
          studio_name: string
          suspended: boolean
          theme_preference: string
          updated_at: string
          user_id: string
          watermark_opacity: number | null
          watermark_position: string | null
          watermark_text: string | null
        }
        Insert: {
          accent_preference?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          force_logout_requested?: boolean
          id?: string
          mobile?: string | null
          onboarding_completed?: boolean
          plan?: string
          storage_limit_mb?: number | null
          studio_accent_color?: string | null
          studio_logo_url?: string | null
          studio_name?: string
          suspended?: boolean
          theme_preference?: string
          updated_at?: string
          user_id: string
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_text?: string | null
        }
        Update: {
          accent_preference?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          force_logout_requested?: boolean
          id?: string
          mobile?: string | null
          onboarding_completed?: boolean
          plan?: string
          storage_limit_mb?: number | null
          studio_accent_color?: string | null
          studio_logo_url?: string | null
          studio_name?: string
          suspended?: boolean
          theme_preference?: string
          updated_at?: string
          user_id?: string
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_text?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_email: string | null
          referrer_id: string
          reward_granted: boolean | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referred_email?: string | null
          referrer_id: string
          reward_granted?: boolean | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referred_email?: string | null
          referrer_id?: string
          reward_granted?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      reflections_posts: {
        Row: {
          body: string | null
          card_type: string
          content_type: string
          created_at: string
          cta_action: string | null
          cta_label: string | null
          cta_link: string | null
          cta_route: string | null
          cta_text: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_pinned: boolean
          is_published: boolean
          is_today: boolean | null
          scheduled_at: string | null
          sort_order: number | null
          tab: string
          tag: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          card_type?: string
          content_type?: string
          created_at?: string
          cta_action?: string | null
          cta_label?: string | null
          cta_link?: string | null
          cta_route?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_pinned?: boolean
          is_published?: boolean
          is_today?: boolean | null
          scheduled_at?: string | null
          sort_order?: number | null
          tab?: string
          tag?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          card_type?: string
          content_type?: string
          created_at?: string
          cta_action?: string | null
          cta_label?: string | null
          cta_link?: string | null
          cta_route?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_pinned?: boolean
          is_published?: boolean
          is_today?: boolean | null
          scheduled_at?: string | null
          sort_order?: number | null
          tab?: string
          tag?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reflections_saved: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_saved_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "reflections_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_pages: {
        Row: {
          body_html: string | null
          created_at: string
          heading: string | null
          id: string
          keywords: string[] | null
          leads_captured: number | null
          location: string | null
          meta_description: string | null
          page_type: string
          slug: string
          status: string
          title: string
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          body_html?: string | null
          created_at?: string
          heading?: string | null
          id?: string
          keywords?: string[] | null
          leads_captured?: number | null
          location?: string | null
          meta_description?: string | null
          page_type?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          body_html?: string | null
          created_at?: string
          heading?: string | null
          id?: string
          keywords?: string[] | null
          leads_captured?: number | null
          location?: string | null
          meta_description?: string | null
          page_type?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      smart_nudges: {
        Row: {
          action_data: Json | null
          action_type: string | null
          body: string
          created_at: string
          expires_at: string | null
          icon: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          nudge_type: string
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          body: string
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          nudge_type: string
          priority?: string
          title: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          body?: string
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          nudge_type?: string
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sneak_peeks: {
        Row: {
          created_at: string
          event_id: string
          id: string
          photo_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          photo_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sneak_peeks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sneak_peeks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sneak_peeks_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      storybook_blocks: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string | null
          id: string
          layout_type: string
          photo_urls: string[]
          sort_order: number
          storybook_id: string
          subtitle: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          layout_type?: string
          photo_urls?: string[]
          sort_order?: number
          storybook_id: string
          subtitle?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          layout_type?: string
          photo_urls?: string[]
          sort_order?: number
          storybook_id?: string
          subtitle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storybook_blocks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storybook_blocks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storybook_blocks_storybook_id_fkey"
            columns: ["storybook_id"]
            isOneToOne: false
            referencedRelation: "storybooks"
            referencedColumns: ["id"]
          },
        ]
      }
      storybook_otp: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          otp_code: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      storybooks: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          slides_data: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slides_data?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slides_data?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_profiles: {
        Row: {
          bio: string | null
          body_font: string | null
          brand_assets: Json | null
          brand_preset: string | null
          cover_url: string | null
          created_at: string
          custom_domain: string | null
          display_name: string | null
          featured_gallery_ids: string[] | null
          font_style: string | null
          footer_text: string | null
          heading_font: string | null
          hero_button_label: string | null
          hero_button_url: string | null
          id: string
          instagram: string | null
          location: string | null
          phone: string | null
          portfolio_layout: string | null
          portfolio_photo_ids: string[] | null
          section_order: Json | null
          section_visibility: Json | null
          services_data: Json | null
          testimonials_data: Json | null
          user_id: string
          username: string | null
          watermark_logo_url: string | null
          watermark_opacity: number | null
          watermark_position: string | null
          website: string | null
          website_images: Json | null
          website_template: string | null
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          body_font?: string | null
          brand_assets?: Json | null
          brand_preset?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          display_name?: string | null
          featured_gallery_ids?: string[] | null
          font_style?: string | null
          footer_text?: string | null
          heading_font?: string | null
          hero_button_label?: string | null
          hero_button_url?: string | null
          id?: string
          instagram?: string | null
          location?: string | null
          phone?: string | null
          portfolio_layout?: string | null
          portfolio_photo_ids?: string[] | null
          section_order?: Json | null
          section_visibility?: Json | null
          services_data?: Json | null
          testimonials_data?: Json | null
          user_id: string
          username?: string | null
          watermark_logo_url?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          website?: string | null
          website_images?: Json | null
          website_template?: string | null
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          body_font?: string | null
          brand_assets?: Json | null
          brand_preset?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          display_name?: string | null
          featured_gallery_ids?: string[] | null
          font_style?: string | null
          footer_text?: string | null
          heading_font?: string | null
          hero_button_label?: string | null
          hero_button_url?: string | null
          id?: string
          instagram?: string | null
          location?: string | null
          phone?: string | null
          portfolio_layout?: string | null
          portfolio_photo_ids?: string[] | null
          section_order?: Json | null
          section_visibility?: Json | null
          services_data?: Json | null
          testimonials_data?: Json | null
          user_id?: string
          username?: string | null
          watermark_logo_url?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          website?: string | null
          website_images?: Json | null
          website_template?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      studio_suggestions: {
        Row: {
          action_data: Json | null
          body: string
          created_at: string
          id: string
          is_acted: boolean
          is_dismissed: boolean
          suggestion_type: string
          title: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          body: string
          created_at?: string
          id?: string
          is_acted?: boolean
          is_dismissed?: boolean
          suggestion_type: string
          title: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          body?: string
          created_at?: string
          id?: string
          is_acted?: boolean
          is_dismissed?: boolean
          suggestion_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          id: string
          name: string
          published: boolean
          sections: Json
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          published?: boolean
          sections?: Json
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          published?: boolean
          sections?: Json
        }
        Relationships: []
      }
      user_collections: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_private: boolean
          item_count: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean
          item_count?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean
          item_count?: number
          name?: string
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
      website_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          photographer_id: string
          website_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          photographer_id: string
          website_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          photographer_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_leads_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "photographer_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_templates: {
        Row: {
          bg_color: string
          card_bg: string
          category: string
          created_at: string
          demo_content: Json
          description: string | null
          font_family: string
          footer_bg: string
          footer_text_color: string
          header_style: string
          hero_style: string
          id: string
          is_active: boolean
          label: string
          nav_bg: string
          nav_border: string
          preview_image_url: string | null
          section_config: Json
          slug: string
          sort_order: number
          styling_config: Json
          text_color: string
          text_secondary_color: string
          ui_font_family: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          card_bg?: string
          category?: string
          created_at?: string
          demo_content?: Json
          description?: string | null
          font_family?: string
          footer_bg?: string
          footer_text_color?: string
          header_style?: string
          hero_style?: string
          id?: string
          is_active?: boolean
          label: string
          nav_bg?: string
          nav_border?: string
          preview_image_url?: string | null
          section_config?: Json
          slug: string
          sort_order?: number
          styling_config?: Json
          text_color?: string
          text_secondary_color?: string
          ui_font_family?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          card_bg?: string
          category?: string
          created_at?: string
          demo_content?: Json
          description?: string | null
          font_family?: string
          footer_bg?: string
          footer_text_color?: string
          header_style?: string
          hero_style?: string
          id?: string
          is_active?: boolean
          label?: string
          nav_bg?: string
          nav_border?: string
          preview_image_url?: string | null
          section_config?: Json
          slug?: string
          sort_order?: number
          styling_config?: Json
          text_color?: string
          text_secondary_color?: string
          ui_font_family?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_events: {
        Row: {
          cover_url: string | null
          download_requires_password: boolean | null
          download_resolution: string | null
          downloads_enabled: boolean | null
          event_date: string | null
          face_recognition_enabled: boolean | null
          gallery_layout: string | null
          gallery_style: string | null
          has_password: boolean | null
          has_pin: boolean | null
          hero_button_label: string | null
          hero_couple_name: string | null
          hero_subtitle: string | null
          id: string | null
          is_published: boolean | null
          name: string | null
          selection_mode_enabled: boolean | null
          slug: string | null
          user_id: string | null
          watermark_enabled: boolean | null
        }
        Insert: {
          cover_url?: string | null
          download_requires_password?: boolean | null
          download_resolution?: string | null
          downloads_enabled?: boolean | null
          event_date?: string | null
          face_recognition_enabled?: boolean | null
          gallery_layout?: string | null
          gallery_style?: string | null
          has_password?: never
          has_pin?: never
          hero_button_label?: string | null
          hero_couple_name?: string | null
          hero_subtitle?: string | null
          id?: string | null
          is_published?: boolean | null
          name?: string | null
          selection_mode_enabled?: boolean | null
          slug?: string | null
          user_id?: string | null
          watermark_enabled?: boolean | null
        }
        Update: {
          cover_url?: string | null
          download_requires_password?: boolean | null
          download_resolution?: string | null
          downloads_enabled?: boolean | null
          event_date?: string | null
          face_recognition_enabled?: boolean | null
          gallery_layout?: string | null
          gallery_style?: string | null
          has_password?: never
          has_pin?: never
          hero_button_label?: string | null
          hero_couple_name?: string | null
          hero_subtitle?: string | null
          id?: string | null
          is_published?: boolean | null
          name?: string | null
          selection_mode_enabled?: boolean | null
          slug?: string | null
          user_id?: string | null
          watermark_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_admin_pin: {
        Args: { new_pin: string; reset_token: string }
        Returns: Json
      }
      verify_admin_pin: { Args: { pin_input: string }; Returns: Json }
      verify_download_password: {
        Args: { event_id: string; password_input: string }
        Returns: Json
      }
      verify_gallery_password: {
        Args: { event_id: string; password_input: string }
        Returns: Json
      }
      verify_gallery_pin: {
        Args: { event_id: string; pin_input: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "photographer" | "client" | "super_admin"
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
      app_role: ["admin", "photographer", "client", "super_admin"],
    },
  },
} as const
