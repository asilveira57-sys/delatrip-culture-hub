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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      config_site: {
        Row: {
          chave: string
          created_at: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          created_at?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      curtida: {
        Row: {
          alvo: string
          anon_id: string
          created_at: string
          id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          alvo: string
          anon_id: string
          created_at?: string
          id?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          alvo?: string
          anon_id?: string
          created_at?: string
          id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      enriquecimento_log: {
        Row: {
          aprovado: boolean
          created_at: string
          custo_usd: number
          id: string
          modelo: string
          motivos: string[]
          slug: string
          tokens_entrada: number
          tokens_saida: number
          updated_at: string
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          custo_usd?: number
          id?: string
          modelo: string
          motivos?: string[]
          slug: string
          tokens_entrada?: number
          tokens_saida?: number
          updated_at?: string
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          custo_usd?: number
          id?: string
          modelo?: string
          motivos?: string[]
          slug?: string
          tokens_entrada?: number
          tokens_saida?: number
          updated_at?: string
        }
        Relationships: []
      }
      pagina: {
        Row: {
          atualizado_em: string | null
          blocos: Json | null
          caminho: string
          created_at: string
          updated_at: string
        }
        Insert: {
          atualizado_em?: string | null
          blocos?: Json | null
          caminho: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          atualizado_em?: string | null
          blocos?: Json | null
          caminho?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post: {
        Row: {
          autor: string | null
          capa_alt: string | null
          capa_url: string | null
          categoria: string | null
          conteudo_html: string | null
          created_at: string
          publicado: boolean
          publicado_em: string | null
          resumo: string | null
          seo_descricao: string | null
          seo_titulo: string | null
          slug: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string | null
          capa_alt?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo_html?: string | null
          created_at?: string
          publicado?: boolean
          publicado_em?: string | null
          resumo?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          slug: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string | null
          capa_alt?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo_html?: string | null
          created_at?: string
          publicado?: boolean
          publicado_em?: string | null
          resumo?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          slug?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      produto_overlay: {
        Row: {
          created_at: string
          descricao_html: string | null
          descricao_original: string | null
          destaque: boolean | null
          enriquecido_em: string | null
          enriquecido_modelo: string | null
          observacao: string | null
          oculto: boolean
          seo_descricao: string | null
          seo_titulo: string | null
          slug: string
          status_revisao: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao_html?: string | null
          descricao_original?: string | null
          destaque?: boolean | null
          enriquecido_em?: string | null
          enriquecido_modelo?: string | null
          observacao?: string | null
          oculto?: boolean
          seo_descricao?: string | null
          seo_titulo?: string | null
          slug: string
          status_revisao?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao_html?: string | null
          descricao_original?: string | null
          destaque?: boolean | null
          enriquecido_em?: string | null
          enriquecido_modelo?: string | null
          observacao?: string | null
          oculto?: boolean
          seo_descricao?: string | null
          seo_titulo?: string | null
          slug?: string
          status_revisao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      produto_post_relacionado: {
        Row: {
          created_at: string
          ordem: number
          slug_post: string
          slug_produto: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ordem?: number
          slug_post: string
          slug_produto: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ordem?: number
          slug_post?: string
          slug_produto?: string
          updated_at?: string
        }
        Relationships: []
      }
      produto_relacionado: {
        Row: {
          created_at: string
          ordem: number
          slug_destino: string
          slug_origem: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ordem?: number
          slug_destino: string
          slug_origem: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ordem?: number
          slug_destino?: string
          slug_origem?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_rota: {
        Row: {
          caminho: string
          created_at: string
          descricao: string | null
          noindex: boolean
          og_imagem: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          caminho: string
          created_at?: string
          descricao?: string | null
          noindex?: boolean
          og_imagem?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          caminho?: string
          created_at?: string
          descricao?: string | null
          noindex?: boolean
          og_imagem?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      curtida_contagem: {
        Row: {
          alvo: string | null
          tipo: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      curtir: {
        Args: { p_alvo: string; p_anon_id: string; p_tipo: string }
        Returns: number
      }
      descurtir: {
        Args: { p_alvo: string; p_anon_id: string; p_tipo: string }
        Returns: number
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
