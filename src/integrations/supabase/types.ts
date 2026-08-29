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
      cluster_seo: {
        Row: {
          created_at: string
          descricao: string | null
          nome: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          nome: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          nome?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      consentimento_cookie: {
        Row: {
          anon_id: string
          categorias: Json
          created_at: string
          id: string
          updated_at: string
          versao: string
        }
        Insert: {
          anon_id: string
          categorias?: Json
          created_at?: string
          id?: string
          updated_at?: string
          versao: string
        }
        Update: {
          anon_id?: string
          categorias?: Json
          created_at?: string
          id?: string
          updated_at?: string
          versao?: string
        }
        Relationships: []
      }
      contato_mensagem: {
        Row: {
          assunto: string
          categoria: string
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          mensagem: string
          nome: string
          origem: string | null
          status: string
          telefone: string | null
          updated_at: string
          utm: Json
        }
        Insert: {
          assunto: string
          categoria?: string
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          mensagem: string
          nome: string
          origem?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          utm?: Json
        }
        Update: {
          assunto?: string
          categoria?: string
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          mensagem?: string
          nome?: string
          origem?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          utm?: Json
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
      documento_legal: {
        Row: {
          chave: string
          conteudo_html: string
          created_at: string
          publicado_em: string | null
          status: string
          titulo: string
          updated_at: string
          versao: string
        }
        Insert: {
          chave: string
          conteudo_html?: string
          created_at?: string
          publicado_em?: string | null
          status?: string
          titulo: string
          updated_at?: string
          versao?: string
        }
        Update: {
          chave?: string
          conteudo_html?: string
          created_at?: string
          publicado_em?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          versao?: string
        }
        Relationships: []
      }
      documento_legal_versao: {
        Row: {
          chave: string
          conteudo_html: string
          created_at: string
          id: string
          titulo: string
          versao: string
        }
        Insert: {
          chave: string
          conteudo_html: string
          created_at?: string
          id?: string
          titulo: string
          versao: string
        }
        Update: {
          chave?: string
          conteudo_html?: string
          created_at?: string
          id?: string
          titulo?: string
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_legal_versao_chave_fkey"
            columns: ["chave"]
            isOneToOne: false
            referencedRelation: "documento_legal"
            referencedColumns: ["chave"]
          },
        ]
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
      faq_item: {
        Row: {
          alvo: string
          created_at: string
          id: string
          ordem: number
          origem: string
          pergunta: string
          resposta: string
          tipo: string
          updated_at: string
        }
        Insert: {
          alvo: string
          created_at?: string
          id?: string
          ordem?: number
          origem?: string
          pergunta: string
          resposta: string
          tipo: string
          updated_at?: string
        }
        Update: {
          alvo?: string
          created_at?: string
          id?: string
          ordem?: number
          origem?: string
          pergunta?: string
          resposta?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      lgpd_solicitacao: {
        Row: {
          created_at: string
          descricao: string
          email: string
          id: string
          ip_hash: string | null
          nome: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          email: string
          id?: string
          ip_hash?: string | null
          nome: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          email?: string
          id?: string
          ip_hash?: string | null
          nome?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      marca_overlay: {
        Row: {
          created_at: string
          manual: boolean
          mesclar_em: string | null
          nome: string | null
          oculto: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          manual?: boolean
          mesclar_em?: string | null
          nome?: string | null
          oculto?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          manual?: boolean
          mesclar_em?: string | null
          nome?: string | null
          oculto?: boolean
          slug?: string
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
      podcast_episodio: {
        Row: {
          capa_alt: string | null
          capa_url: string | null
          conteudo_html: string | null
          created_at: string
          data_publicacao: string | null
          descricao: string | null
          duracao: string | null
          og_imagem: string | null
          outro_url: string | null
          participantes: string | null
          publicado: boolean
          resumo: string | null
          seo_descricao: string | null
          seo_keywords: string | null
          seo_titulo: string | null
          slug: string
          spotify_url: string | null
          titulo: string
          transcricao: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          capa_alt?: string | null
          capa_url?: string | null
          conteudo_html?: string | null
          created_at?: string
          data_publicacao?: string | null
          descricao?: string | null
          duracao?: string | null
          og_imagem?: string | null
          outro_url?: string | null
          participantes?: string | null
          publicado?: boolean
          resumo?: string | null
          seo_descricao?: string | null
          seo_keywords?: string | null
          seo_titulo?: string | null
          slug: string
          spotify_url?: string | null
          titulo: string
          transcricao?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          capa_alt?: string | null
          capa_url?: string | null
          conteudo_html?: string | null
          created_at?: string
          data_publicacao?: string | null
          descricao?: string | null
          duracao?: string | null
          og_imagem?: string | null
          outro_url?: string | null
          participantes?: string | null
          publicado?: boolean
          resumo?: string | null
          seo_descricao?: string | null
          seo_keywords?: string | null
          seo_titulo?: string | null
          slug?: string
          spotify_url?: string | null
          titulo?: string
          transcricao?: string | null
          updated_at?: string
          youtube_url?: string | null
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
          og_descricao: string | null
          og_imagem_alt: string | null
          og_imagem_url: string | null
          og_titulo: string | null
          publicado: boolean
          publicado_em: string | null
          resumo: string | null
          seo_descricao: string | null
          seo_keywords: string | null
          seo_titulo: string | null
          slug: string
          titulo: string
          twitter_card: string
          updated_at: string
        }
        Insert: {
          autor?: string | null
          capa_alt?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo_html?: string | null
          created_at?: string
          og_descricao?: string | null
          og_imagem_alt?: string | null
          og_imagem_url?: string | null
          og_titulo?: string | null
          publicado?: boolean
          publicado_em?: string | null
          resumo?: string | null
          seo_descricao?: string | null
          seo_keywords?: string | null
          seo_titulo?: string | null
          slug: string
          titulo: string
          twitter_card?: string
          updated_at?: string
        }
        Update: {
          autor?: string | null
          capa_alt?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo_html?: string | null
          created_at?: string
          og_descricao?: string | null
          og_imagem_alt?: string | null
          og_imagem_url?: string | null
          og_titulo?: string | null
          publicado?: boolean
          publicado_em?: string | null
          resumo?: string | null
          seo_descricao?: string | null
          seo_keywords?: string | null
          seo_titulo?: string | null
          slug?: string
          titulo?: string
          twitter_card?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_cluster: {
        Row: {
          cluster_slug: string
          created_at: string
          principal: boolean
          slug_post: string
          updated_at: string
        }
        Insert: {
          cluster_slug: string
          created_at?: string
          principal?: boolean
          slug_post: string
          updated_at?: string
        }
        Update: {
          cluster_slug?: string
          created_at?: string
          principal?: boolean
          slug_post?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_cluster_cluster_slug_fkey"
            columns: ["cluster_slug"]
            isOneToOne: false
            referencedRelation: "cluster_seo"
            referencedColumns: ["slug"]
          },
        ]
      }
      post_link_interno: {
        Row: {
          ancora: string
          created_at: string
          id: string
          score: number
          slug_destino: string
          slug_post: string
          status: string
          updated_at: string
        }
        Insert: {
          ancora: string
          created_at?: string
          id?: string
          score?: number
          slug_destino: string
          slug_post: string
          status?: string
          updated_at?: string
        }
        Update: {
          ancora?: string
          created_at?: string
          id?: string
          score?: number
          slug_destino?: string
          slug_post?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_post_relacao: {
        Row: {
          created_at: string
          excluido: boolean
          fixado: boolean
          manual: boolean
          origem: string
          posicao: number
          score: number
          slug_destino: string
          slug_origem: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          excluido?: boolean
          fixado?: boolean
          manual?: boolean
          origem?: string
          posicao?: number
          score?: number
          slug_destino: string
          slug_origem: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          excluido?: boolean
          fixado?: boolean
          manual?: boolean
          origem?: string
          posicao?: number
          score?: number
          slug_destino?: string
          slug_origem?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_produto_relacao: {
        Row: {
          created_at: string
          excluido: boolean
          fixado: boolean
          manual: boolean
          origem: string
          posicao: number
          score: number
          slug_post: string
          slug_produto: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          excluido?: boolean
          fixado?: boolean
          manual?: boolean
          origem?: string
          posicao?: number
          score?: number
          slug_post: string
          slug_produto: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          excluido?: boolean
          fixado?: boolean
          manual?: boolean
          origem?: string
          posicao?: number
          score?: number
          slug_post?: string
          slug_produto?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_relacionamento_config: {
        Row: {
          categorias: Json
          created_at: string
          exibir_sem_estoque: boolean | null
          modo_conteudos: string
          modo_produtos: string
          ordenacao_conteudos: string
          ordenacao_produtos: string
          quantidade_conteudos: number | null
          quantidade_produtos: number | null
          recalculado_em: string | null
          slug_post: string
          updated_at: string
        }
        Insert: {
          categorias?: Json
          created_at?: string
          exibir_sem_estoque?: boolean | null
          modo_conteudos?: string
          modo_produtos?: string
          ordenacao_conteudos?: string
          ordenacao_produtos?: string
          quantidade_conteudos?: number | null
          quantidade_produtos?: number | null
          recalculado_em?: string | null
          slug_post: string
          updated_at?: string
        }
        Update: {
          categorias?: Json
          created_at?: string
          exibir_sem_estoque?: boolean | null
          modo_conteudos?: string
          modo_produtos?: string
          ordenacao_conteudos?: string
          ordenacao_produtos?: string
          quantidade_conteudos?: number | null
          quantidade_produtos?: number | null
          recalculado_em?: string | null
          slug_post?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_tag: {
        Row: {
          created_at: string
          slug_post: string
          tag: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          slug_post: string
          tag: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          slug_post?: string
          tag?: string
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
          marca_slug: string | null
          observacao: string | null
          oculto: boolean
          seo_descricao: string | null
          seo_keywords: string | null
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
          marca_slug?: string | null
          observacao?: string | null
          oculto?: boolean
          seo_descricao?: string | null
          seo_keywords?: string | null
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
          marca_slug?: string | null
          observacao?: string | null
          oculto?: boolean
          seo_descricao?: string | null
          seo_keywords?: string | null
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
          canonical: string | null
          created_at: string
          descricao: string | null
          nofollow: boolean
          noindex: boolean
          og_imagem: string | null
          seo_keywords: string | null
          titulo: string | null
          twitter_imagem: string | null
          updated_at: string
        }
        Insert: {
          caminho: string
          canonical?: string | null
          created_at?: string
          descricao?: string | null
          nofollow?: boolean
          noindex?: boolean
          og_imagem?: string | null
          seo_keywords?: string | null
          titulo?: string | null
          twitter_imagem?: string | null
          updated_at?: string
        }
        Update: {
          caminho?: string
          canonical?: string | null
          created_at?: string
          descricao?: string | null
          nofollow?: boolean
          noindex?: boolean
          og_imagem?: string | null
          seo_keywords?: string | null
          titulo?: string | null
          twitter_imagem?: string | null
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
      registrar_consentimento: {
        Args: { p_anon_id: string; p_categorias: Json; p_versao: string }
        Returns: undefined
      }
      registrar_contato: {
        Args: {
          p_assunto: string
          p_categoria: string
          p_email: string
          p_ip_hash: string
          p_mensagem: string
          p_nome: string
          p_origem: string
          p_telefone: string
          p_utm: Json
        }
        Returns: string
      }
      registrar_lgpd: {
        Args: {
          p_descricao: string
          p_email: string
          p_ip_hash: string
          p_nome: string
          p_tipo: string
        }
        Returns: string
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
