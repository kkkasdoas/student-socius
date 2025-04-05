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
      blocked_users: {
        Row: {
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          created_at: string
          role: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          created_at?: string
          role?: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
          created_at?: string
          role?: string
        }
      }
      conversations: {
        Row: {
          id: string
          type: string
          chatroom_name?: string
          photo?: string
          post_id?: string
          last_message_content?: string
          last_message_sender_id?: string
          last_message_timestamp?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          chatroom_name?: string
          photo?: string
          post_id?: string
          last_message_content?: string
          last_message_sender_id?: string
          last_message_timestamp?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          chatroom_name?: string
          photo?: string
          post_id?: string
          last_message_content?: string
          last_message_sender_id?: string
          last_message_timestamp?: string
          created_at?: string
          updated_at?: string
        }
      }
      hidden_posts: {
        Row: {
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          reaction: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          reaction: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          reaction?: string
          created_at?: string
        }
      }
      message_reports: {
        Row: {
          id: string
          reporter_id: string
          message_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          message_id: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          message_id?: string
          reason?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          is_read: boolean
          is_edited: boolean
          reply_to_id?: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          is_read?: boolean
          is_edited?: boolean
          reply_to_id?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          is_read?: boolean
          is_edited?: boolean
          reply_to_id?: string
        }
      }
      muted_users: {
        Row: {
          muter_id: string
          muted_id: string
          created_at: string
        }
        Insert: {
          muter_id: string
          muted_id: string
          created_at?: string
        }
        Update: {
          muter_id?: string
          muted_id?: string
          created_at?: string
        }
      }
      post_authors: {
        Insert: {
          post_id?: string
          user_id?: string
          display_name?: string
          profile_picture_url?: string
          university?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          display_name?: string
          profile_picture_url?: string
          university?: string
        }
      }
      post_reports: {
        Row: {
          id: string
          reporter_id: string
          post_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          post_id: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          post_id?: string
          reason?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          university?: string
          image_url?: string
          channel_type: string
          category?: string
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          university?: string
          image_url?: string
          channel_type: string
          category?: string
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          university?: string
          image_url?: string
          channel_type?: string
          category?: string
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          bio?: string
          university?: string
          verification_status?: string
          profile_picture_url?: string
          auth_provider?: string
          login_email?: string
          login_name?: string
          last_login?: string
          block_status?: boolean
          is_deleted?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          bio?: string
          university?: string
          verification_status?: string
          profile_picture_url?: string
          auth_provider?: string
          login_email?: string
          login_name?: string
          last_login?: string
          block_status?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          bio?: string
          university?: string
          verification_status?: string
          profile_picture_url?: string
          auth_provider?: string
          login_email?: string
          login_name?: string
          last_login?: string
          block_status?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          type?: string
          created_at?: string
        }
      }
      saved_posts: {
        Row: {
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      user_devices: {
        Row: {
          id: string
          user_id: string
          device_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_token: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_token?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          reason?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          mute_all_notifications: boolean
          private_chat_notifications: boolean
          chatroom_notifications: boolean
          dark_mode: boolean
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          mute_all_notifications?: boolean
          private_chat_notifications?: boolean
          chatroom_notifications?: boolean
          dark_mode?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          mute_all_notifications?: boolean
          private_chat_notifications?: boolean
          chatroom_notifications?: boolean
          dark_mode?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      verified_domains: {
        Row: {
          id: number
          domain: string
          created_at?: string
          university?: string
        }
        Insert: {
          id?: number
          domain: string
          created_at?: string
          university?: string
        }
        Update: {
          id?: number
          domain?: string
          created_at?: string
          university?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
