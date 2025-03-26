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
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      Clientes: {
        Row: {
          conversationid: string | null
          created_at: string
          empresa: number | null
          id: number
          Nome: string | null
          whatsappcliente: string | null
        }
        Insert: {
          conversationid?: string | null
          created_at?: string
          empresa?: number | null
          id?: number
          Nome?: string | null
          whatsappcliente?: string | null
        }
        Update: {
          conversationid?: string | null
          created_at?: string
          empresa?: number | null
          id?: number
          Nome?: string | null
          whatsappcliente?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Clientes_empresa_fkey"
            columns: ["empresa"]
            isOneToOne: false
            referencedRelation: "Empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          members: number
          name: string
          posting_restrictions: string
          posts: number
          updated_at: string
          visibility: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          members?: number
          name: string
          posting_restrictions: string
          posts?: number
          updated_at?: string
          visibility: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          members?: number
          name?: string
          posting_restrictions?: string
          posts?: number
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "community_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      community_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      Corte_Express_Alunos: {
        Row: {
          created_at: string
          id: number
          Nome: string | null
          Status: string | null
          Telefone: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          Nome?: string | null
          Status?: string | null
          Telefone?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          Nome?: string | null
          Status?: string | null
          Telefone?: number | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      Empresa: {
        Row: {
          apidifybot: string | null
          created_at: string
          id: number
          NomeEmpresa: string | null
          Whatsapp: string | null
        }
        Insert: {
          apidifybot?: string | null
          created_at?: string
          id?: number
          NomeEmpresa?: string | null
          Whatsapp?: string | null
        }
        Update: {
          apidifybot?: string | null
          created_at?: string
          id?: number
          NomeEmpresa?: string | null
          Whatsapp?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          location: string | null
          presenter: string
          time_end: string
          time_start: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          id?: string
          location?: string | null
          presenter: string
          time_end: string
          time_start: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          location?: string | null
          presenter?: string
          time_end?: string
          time_start?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_links: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      Lead_mensagem: {
        Row: {
          created_at: string
          id: number
          Nome: string | null
          Status: string | null
          Telefone: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          Nome?: string | null
          Status?: string | null
          Telefone?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          Nome?: string | null
          Status?: string | null
          Telefone?: number | null
        }
        Relationships: []
      }
      leadmensagem2: {
        Row: {
          created_at: string
          id: number
          nome: string | null
          status: string | null
          telefone: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          nome?: string | null
          status?: string | null
          telefone?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          nome?: string | null
          status?: string | null
          telefone?: number | null
        }
        Relationships: []
      }
      mcbs: {
        Row: {
          content: string | null
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
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
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category_id: string | null
          comments_count: number
          community_id: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          is_trending: boolean
          likes_count: number
          media_data: Json | null
          poll_data: Json | null
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          category_id?: string | null
          comments_count?: number
          community_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_trending?: boolean
          likes_count?: number
          media_data?: Json | null
          poll_data?: Json | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          category_id?: string | null
          comments_count?: number
          community_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_trending?: boolean
          likes_count?: number
          media_data?: Json | null
          poll_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          headline: string | null
          id: string
          language: string | null
          location: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          language?: string | null
          location?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          language?: string | null
          location?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          answers: Json | null
          created_at: string | null
          email: string
          id: number
          name: string
          submitted_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          email: string
          id?: number
          name: string
          submitted_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          email?: string
          id?: number
          name?: string
          submitted_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      trending_settings: {
        Row: {
          id: string
          min_comments: number
          min_likes: number
          timeframe_hours: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          min_comments?: number
          min_likes?: number
          timeframe_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          min_comments?: number
          min_likes?: number
          timeframe_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_rankings: {
        Row: {
          comments_count: number
          created_at: string
          id: string
          level: number
          likes_received: number
          points: number
          posts_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          created_at?: string
          id?: string
          level?: number
          likes_received?: number
          points?: number
          posts_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          created_at?: string
          id?: string
          level?: number
          likes_received?: number
          points?: number
          posts_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vector_table_2: {
        Row: {
          content: string
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      Whatsapp_Dasc: {
        Row: {
          mensagem: Json
          sessionid: string
        }
        Insert: {
          mensagem: Json
          sessionid: string
        }
        Update: {
          mensagem?: Json
          sessionid?: string
        }
        Relationships: []
      }
      Whatsapp_Igaming_Laise: {
        Row: {
          mensagem: Json
          sessionid: string
        }
        Insert: {
          mensagem: Json
          sessionid: string
        }
        Update: {
          mensagem?: Json
          sessionid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          p_user_id: string
          p_role: string
        }
        Returns: boolean
      }
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id?: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      user_role: "admin" | "moderator" | "user"
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
