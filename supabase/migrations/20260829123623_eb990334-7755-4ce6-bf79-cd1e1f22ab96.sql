-- Clusters temáticos do blog
CREATE TABLE public.cluster_seo (
  slug text PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cluster_seo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cluster_seo TO authenticated;
GRANT ALL ON public.cluster_seo TO service_role;
ALTER TABLE public.cluster_seo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cluster leitura publica" ON public.cluster_seo FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cluster escrita autenticada" ON public.cluster_seo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER cluster_seo_updated_at BEFORE UPDATE ON public.cluster_seo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Cluster(s) de cada post
CREATE TABLE public.post_cluster (
  slug_post text NOT NULL,
  cluster_slug text NOT NULL REFERENCES public.cluster_seo(slug) ON DELETE CASCADE,
  principal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug_post, cluster_slug)
);
GRANT SELECT ON public.post_cluster TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_cluster TO authenticated;
GRANT ALL ON public.post_cluster TO service_role;
ALTER TABLE public.post_cluster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post cluster leitura publica" ON public.post_cluster FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post cluster escrita autenticada" ON public.post_cluster FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_cluster_updated_at BEFORE UPDATE ON public.post_cluster FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tags do post
CREATE TABLE public.post_tag (
  slug_post text NOT NULL,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug_post, tag)
);
GRANT SELECT ON public.post_tag TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tag TO authenticated;
GRANT ALL ON public.post_tag TO service_role;
ALTER TABLE public.post_tag ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post tag leitura publica" ON public.post_tag FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post tag escrita autenticada" ON public.post_tag FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_tag_updated_at BEFORE UPDATE ON public.post_tag FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Configuração de relacionamentos por post
CREATE TABLE public.post_relacionamento_config (
  slug_post text PRIMARY KEY,
  modo_produtos text NOT NULL DEFAULT 'hibrido',
  modo_conteudos text NOT NULL DEFAULT 'hibrido',
  quantidade_produtos integer,
  quantidade_conteudos integer,
  ordenacao_produtos text NOT NULL DEFAULT 'relevancia',
  ordenacao_conteudos text NOT NULL DEFAULT 'relevancia',
  categorias jsonb NOT NULL DEFAULT '[]'::jsonb,
  exibir_sem_estoque boolean,
  recalculado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_relacionamento_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_relacionamento_config TO authenticated;
GRANT ALL ON public.post_relacionamento_config TO service_role;
ALTER TABLE public.post_relacionamento_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config relacionamento leitura publica" ON public.post_relacionamento_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "config relacionamento escrita autenticada" ON public.post_relacionamento_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_relacionamento_config_updated_at BEFORE UPDATE ON public.post_relacionamento_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Relação post -> produto (pré-calculada + manual)
CREATE TABLE public.post_produto_relacao (
  slug_post text NOT NULL,
  slug_produto text NOT NULL,
  origem text NOT NULL DEFAULT 'automatico',
  score numeric NOT NULL DEFAULT 0,
  manual boolean NOT NULL DEFAULT false,
  excluido boolean NOT NULL DEFAULT false,
  fixado boolean NOT NULL DEFAULT false,
  posicao integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug_post, slug_produto)
);
CREATE INDEX post_produto_relacao_post_idx ON public.post_produto_relacao (slug_post, score DESC);
CREATE INDEX post_produto_relacao_produto_idx ON public.post_produto_relacao (slug_produto);
GRANT SELECT ON public.post_produto_relacao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_produto_relacao TO authenticated;
GRANT ALL ON public.post_produto_relacao TO service_role;
ALTER TABLE public.post_produto_relacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post produto leitura publica" ON public.post_produto_relacao FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post produto escrita autenticada" ON public.post_produto_relacao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_produto_relacao_updated_at BEFORE UPDATE ON public.post_produto_relacao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Relação post -> post (pré-calculada + manual)
CREATE TABLE public.post_post_relacao (
  slug_origem text NOT NULL,
  slug_destino text NOT NULL,
  origem text NOT NULL DEFAULT 'automatico',
  score numeric NOT NULL DEFAULT 0,
  manual boolean NOT NULL DEFAULT false,
  excluido boolean NOT NULL DEFAULT false,
  fixado boolean NOT NULL DEFAULT false,
  posicao integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug_origem, slug_destino)
);
CREATE INDEX post_post_relacao_origem_idx ON public.post_post_relacao (slug_origem, score DESC);
GRANT SELECT ON public.post_post_relacao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_post_relacao TO authenticated;
GRANT ALL ON public.post_post_relacao TO service_role;
ALTER TABLE public.post_post_relacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post post leitura publica" ON public.post_post_relacao FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post post escrita autenticada" ON public.post_post_relacao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_post_relacao_updated_at BEFORE UPDATE ON public.post_post_relacao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sugestões de links internos
CREATE TABLE public.post_link_interno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug_post text NOT NULL,
  ancora text NOT NULL,
  slug_destino text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sugerido',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug_post, ancora, slug_destino)
);
CREATE INDEX post_link_interno_post_idx ON public.post_link_interno (slug_post);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_link_interno TO authenticated;
GRANT ALL ON public.post_link_interno TO service_role;
ALTER TABLE public.post_link_interno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "link interno leitura autenticada" ON public.post_link_interno FOR SELECT TO authenticated USING (true);
CREATE POLICY "link interno escrita autenticada" ON public.post_link_interno FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_link_interno_updated_at BEFORE UPDATE ON public.post_link_interno FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();