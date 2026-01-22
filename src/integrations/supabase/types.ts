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
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
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
      community_categories: {
        Row: {
          category_id: string
          community_id: string
        }
        Insert: {
          category_id: string
          community_id: string
        }
        Update: {
          category_id?: string
          community_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_categories_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_site_jp: {
        Row: {
          created_at: string
          email: string
          id: string
          mensagem: string
          nome: string
          status: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          status?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          status?: string | null
          whatsapp?: string | null
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
      credit_cards: {
        Row: {
          closing_day: number
          color: string
          created_at: string
          due_day: number
          id: string
          limit_amount: number
          name: string
          user_id: string
        }
        Insert: {
          closing_day: number
          color: string
          created_at?: string
          due_day: number
          id?: string
          limit_amount: number
          name: string
          user_id: string
        }
        Update: {
          closing_day?: number
          color?: string
          created_at?: string
          due_day?: number
          id?: string
          limit_amount?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          community_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string
          id: string
          size: number | null
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name: string
          id?: string
          size?: number | null
          title: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string
          id?: string
          size?: number | null
          title?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
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
          community_id: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          title: string
          updated_at: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      external_links: {
        Row: {
          category: string | null
          community_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_links_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          id: string
          module_id: string
          order_index: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          module_id: string
          order_index?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          module_id?: string
          order_index?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          order_index: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          title?: string
        }
        Relationships: []
      }
      post_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          post_id: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          post_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          post_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_audit_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
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
          comments_count: number | null
          community_id: string | null
          content: string | null
          created_at: string
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          is_trending: boolean | null
          likes_count: number | null
          media_data: Json | null
          poll_data: Json | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          category_id?: string | null
          comments_count?: number | null
          community_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          is_trending?: boolean | null
          likes_count?: number | null
          media_data?: Json | null
          poll_data?: Json | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          category_id?: string | null
          comments_count?: number | null
          community_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          is_trending?: boolean | null
          likes_count?: number | null
          media_data?: Json | null
          poll_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
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
          Active: boolean | null
          altura: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          headline: string | null
          id: string
          idade: number | null
          is_admin: boolean | null
          language: string | null
          location: string | null
          meta_agua_ml: number | null
          meta_calorias: number | null
          meta_carboidratos: number | null
          meta_gorduras: number | null
          meta_proteina: number | null
          nivel_atividade: string | null
          objetivo: string | null
          onboarding_completo: boolean | null
          peso: number | null
          phone: string | null
          sexo: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_type: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          Active?: boolean | null
          altura?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          idade?: number | null
          is_admin?: boolean | null
          language?: string | null
          location?: string | null
          meta_agua_ml?: number | null
          meta_calorias?: number | null
          meta_carboidratos?: number | null
          meta_gorduras?: number | null
          meta_proteina?: number | null
          nivel_atividade?: string | null
          objetivo?: string | null
          onboarding_completo?: boolean | null
          peso?: number | null
          phone?: string | null
          sexo?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          Active?: boolean | null
          altura?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          idade?: number | null
          is_admin?: boolean | null
          language?: string | null
          location?: string | null
          meta_agua_ml?: number | null
          meta_calorias?: number | null
          meta_carboidratos?: number | null
          meta_gorduras?: number | null
          meta_proteina?: number | null
          nivel_atividade?: string | null
          objetivo?: string | null
          onboarding_completo?: boolean | null
          peso?: number | null
          phone?: string | null
          sexo?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment: string | null
          created_at: string
          details: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          card_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          id: string
          person: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          person?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          person?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      useful_links: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      Whatsapp_Igaming_Laise: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_trending_posts: {
        Args: Record<PropertyKey, never>
        Returns: {
          author_id: string
          category_id: string | null
          community_id: string | null
          content: string | null
          created_at: string
          embedding: string | null
          id: string
          image_url: string | null
          is_fixed: boolean | null
          is_trending: boolean | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }[]
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm_options: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      responsible_type: "Vanessa" | "Vinicius" | "Outro"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "in-progress" | "done"
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
