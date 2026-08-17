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
      quests: {
        Row: {
          id: string
          quest_id: string
          source_content_id: string
          title: string
          description: string | null
          quest_type: string
          secondary_tags: string[]
          template_id: string
          steps: Json
          classification_confidence: number
          region: string
          district: string | null
          latitude: number | null
          longitude: number | null
          image: string | null
          status: string
          source_modified_time: string | null
          proof_type: string
          proof_requirement: string | null
          completion_rule: Json
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "quests_source_content_id_fkey"
            columns: ["source_content_id"]
            isOneToOne: true
            referencedRelation: "tour_places"
            referencedColumns: ["source_content_id"]
          },
        ]
      }
      tour_places: {
        Row: {
          id: string
          source_provider: string
          source_content_id: string
          title: string
          description: string | null
          region: string
          district: string | null
          latitude: number | null
          longitude: number | null
          image: string | null
          content_type: string
          source_modified_time: string | null
          local_score: number
          quality_score: number
          selection_status: string
          last_synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      review_items: {
        Row: {
          id: string
          source_content_id: string
          proposed_quest_type: string | null
          proposed_template_id: string | null
          local_score: number
          quality_score: number
          review_reasons: string[]
          raw_data: Json
          detail_data: Json
          status: string
          source_modified_time: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "review_items_source_content_id_fkey"
            columns: ["source_content_id"]
            isOneToOne: true
            referencedRelation: "tour_places"
            referencedColumns: ["source_content_id"]
          },
        ]
      }
      user_quests: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          status: string
          started_at: string | null
          completed_at: string | null
          abandoned_at: string | null
          expires_at: string | null
          xp_awarded: number
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          user_id: string
          display_name: string
          country_flag: string
          equipped_items: Json
          current_streak: number
          last_active_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string
          country_flag?: string
          equipped_items?: Json
          current_streak?: number
          last_active_date?: string | null
        }
        Update: {
          display_name?: string
          country_flag?: string
          equipped_items?: Json
          current_streak?: number
          last_active_date?: string | null
        }
        Relationships: []
      }
      user_items: {
        Row: {
          user_id: string
          item_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          item_id: string
        }
        Update: never
        Relationships: []
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          quest_id: string | null
          content: string
          photo_path: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          quest_id?: string | null
          content: string
          photo_path?: string | null
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "journal_entries_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_likes: {
        Row: {
          entry_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          entry_id: string
          user_id: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "journal_likes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          user_id_a: string
          user_id_b: string
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      mock_quest_catalog: {
        Row: {
          id: number
          xp: number
          category: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      mock_quest_completions: {
        Row: {
          user_id: string
          mock_quest_id: number
          xp_awarded: number
          completed_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      mock_quest_proofs: {
        Row: {
          id: string
          user_id: string
          mock_quest_id: number
          storage_path: string
          mime_type: string
          size_bytes: number
          submitted_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      quest_reviews: {
        Row: {
          id: string
          user_id: string
          quest_id: string | null
          mock_quest_id: number | null
          rating: number
          review_text: string
          created_at: string
        }
        Insert: {
          user_id: string
          quest_id?: string | null
          mock_quest_id?: number | null
          rating: number
          review_text: string
        }
        Update: never
        Relationships: []
      }
      journal_comments: {
        Row: {
          id: string
          entry_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          entry_id: string
          user_id: string
          content: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "journal_comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string
          emoji: string
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          content: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_proofs: {
        Row: {
          id: string
          user_quest_id: string
          user_id: string
          quest_id: string
          proof_type: string
          proof_status: string
          storage_bucket: string
          storage_path: string
          mime_type: string
          size_bytes: number
          proof_requirement_snapshot: string | null
          completion_rule_snapshot: Json
          submitted_at: string
          reviewed_at: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "quest_proofs_user_quest_id_fkey"
            columns: ["user_quest_id"]
            isOneToOne: false
            referencedRelation: "user_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_proofs_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_events: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          event_type: "VIEW" | "START" | "COMPLETE"
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "quest_events_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      journal_entries_with_counts: {
        Row: {
          id: string
          user_id: string
          quest_id: string | null
          content: string
          photo_path: string | null
          created_at: string
          like_count: number
          comment_count: number
        }
        Relationships: []
      }
      public_xp_totals: {
        Row: {
          user_id: string
          total_xp: number
          completed_quest_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      record_quest_view: {
        Args: { p_quest_id: string }
        Returns: { event_id: string; recorded: boolean }[]
      }
      toggle_friend: {
        Args: { p_other_user_id: string }
        Returns: { is_friend: boolean }[]
      }
      complete_mock_quest: {
        Args: {
          p_mock_quest_id: number
          p_storage_path: string
          p_mime_type: string
          p_size_bytes: number
        }
        Returns: { mock_quest_id: number; xp_awarded: number }[]
      }
      start_quest: {
        Args: { p_quest_id: string }
        Returns: { user_quest_id: string; quest_status: string }[]
      }
      mark_quest_in_progress: {
        Args: { p_quest_id: string }
        Returns: { user_quest_id: string; quest_status: string }[]
      }
      submit_quest_photo: {
        Args: {
          p_quest_id: string
          p_storage_path: string
          p_mime_type: string
          p_size_bytes: number
        }
        Returns: {
          user_quest_id: string
          proof_id: string
          quest_status: string
          proof_status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
