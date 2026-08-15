CREATE TABLE public.produto_post_relacionado (
  slug_produto text NOT NULL,
  slug_post text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug_produto, slug_post)
);
GRANT SELECT ON public.produto_post_relacionado TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_post_relacionado TO authenticated;
GRANT ALL ON public.produto_post_relacionado TO service_role;
ALTER TABLE public.produto_post_relacionado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post relacionado leitura publica" ON public.produto_post_relacionado FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post relacionado escrita autenticada" ON public.produto_post_relacionado FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER produto_post_relacionado_updated_at BEFORE UPDATE ON public.produto_post_relacionado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.enriquecimento_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  modelo text NOT NULL,
  tokens_entrada integer NOT NULL DEFAULT 0,
  tokens_saida integer NOT NULL DEFAULT 0,
  custo_usd numeric(10,6) NOT NULL DEFAULT 0,
  aprovado boolean NOT NULL DEFAULT false,
  motivos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enriquecimento_log TO authenticated;
GRANT ALL ON public.enriquecimento_log TO service_role;
ALTER TABLE public.enriquecimento_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log enriquecimento autenticado" ON public.enriquecimento_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX enriquecimento_log_slug_idx ON public.enriquecimento_log (slug);
CREATE TRIGGER enriquecimento_log_updated_at BEFORE UPDATE ON public.enriquecimento_log FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();