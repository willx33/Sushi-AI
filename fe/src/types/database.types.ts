// fe/src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          folder_id: string | null
          name: string
          model: string
          prompt: string | null
          temperature: number
          context_length: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          folder_id?: string | null
          name: string
          model: string
          prompt?: string | null
          temperature?: number
          context_length?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          folder_id?: string | null
          name?: string
          model?: string
          prompt?: string | null
          temperature?: number
          context_length?: number
          created_at?: string
          updated_at?: string
        }
      }
      file_items: {
        Row: {
          id: string
          user_id: string
          file_id: string
          content: string
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          content: string
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          content?: string
          embedding?: string | null
          created_at?: string
        }
      }
      file_workspaces: {
        Row: {
          id: string
          user_id: string
          file_id: string
          workspace_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          workspace_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          workspace_id?: string
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          file_path: string
          size: number
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          file_path: string
          size: number
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          file_path?: string
          size?: number
          type?: string
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          name: string
          description: string | null
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          name: string
          description?: string | null
          type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          type?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          chat_id: string
          content: string
          role: string
          model: string | null
          sequence_number: number
          image_paths: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_id: string
          content: string
          role: string
          model?: string | null
          sequence_number: number
          image_paths?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chat_id?: string
          content?: string
          role?: string
          model?: string | null
          sequence_number?: number
          image_paths?: string[] | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          openai_api_key: string | null
          anthropic_api_key: string | null
          google_api_key: string | null
          mistral_api_key: string | null
          preferred_language: string
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          openai_api_key?: string | null
          anthropic_api_key?: string | null
          google_api_key?: string | null
          mistral_api_key?: string | null
          preferred_language?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          openai_api_key?: string | null
          anthropic_api_key?: string | null
          google_api_key?: string | null
          mistral_api_key?: string | null
          preferred_language?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_home: boolean
          default_model: string
          default_prompt: string
          default_temperature: number
          default_context_length: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_home?: boolean
          default_model?: string
          default_prompt?: string
          default_temperature?: number
          default_context_length?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_home?: boolean
          default_model?: string
          default_prompt?: string
          default_temperature?: number
          default_context_length?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_file_items: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          content: string
          file_id: string
          user_id: string
          similarity: number
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