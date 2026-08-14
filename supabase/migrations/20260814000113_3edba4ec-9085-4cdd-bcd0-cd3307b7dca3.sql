CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.produto_overlay (
  slug text PRIMARY KEY,
  descricao_html text,
  descricao_original text,
  seo_titulo text,
  seo_descricao text,
  oculto boolean NOT NULL DEFAULT false,
  destaque boolean,
  enriquecido_em timestamptz,
  enriquecido_modelo text,
  status_revisao text CHECK (status_revisao IN ('pendente','aprovado','rejeitado')),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.produto_overlay TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_overlay TO authenticated;
GRANT ALL ON public.produto_overlay TO service_role;
ALTER TABLE public.produto_overlay ENABLE ROW LEVEL SECURITY;
CREATE POLICY "overlay leitura publica" ON public.produto_overlay FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "overlay escrita autenticada" ON public.produto_overlay FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER produto_overlay_updated_at BEFORE UPDATE ON public.produto_overlay FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.produto_relacionado (
  slug_origem text NOT NULL,
  slug_destino text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug_origem, slug_destino),
  CHECK (slug_origem <> slug_destino)
);
GRANT SELECT ON public.produto_relacionado TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_relacionado TO authenticated;
GRANT ALL ON public.produto_relacionado TO service_role;
ALTER TABLE public.produto_relacionado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relacionado leitura publica" ON public.produto_relacionado FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "relacionado escrita autenticada" ON public.produto_relacionado FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER produto_relacionado_updated_at BEFORE UPDATE ON public.produto_relacionado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.curtida (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('produto','post')),
  alvo text NOT NULL,
  anon_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, alvo, anon_id)
);
CREATE INDEX curtida_tipo_alvo_idx ON public.curtida (tipo, alvo);
GRANT SELECT ON public.curtida TO anon, authenticated;
GRANT ALL ON public.curtida TO service_role;
ALTER TABLE public.curtida ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curtida leitura publica" ON public.curtida FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER curtida_updated_at BEFORE UPDATE ON public.curtida FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE VIEW public.curtida_contagem
WITH (security_invoker = true) AS
SELECT tipo, alvo, count(*)::bigint AS total FROM public.curtida GROUP BY tipo, alvo;
GRANT SELECT ON public.curtida_contagem TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.curtir(p_tipo text, p_alvo text, p_anon_id text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total bigint;
BEGIN
  IF p_tipo NOT IN ('produto','post') THEN RAISE EXCEPTION 'tipo invalido'; END IF;
  IF coalesce(length(p_alvo),0) = 0 OR length(p_alvo) > 200 THEN RAISE EXCEPTION 'alvo invalido'; END IF;
  IF coalesce(length(p_anon_id),0) < 8 OR length(p_anon_id) > 64 THEN RAISE EXCEPTION 'anon_id invalido'; END IF;
  INSERT INTO public.curtida (tipo, alvo, anon_id) VALUES (p_tipo, p_alvo, p_anon_id)
  ON CONFLICT (tipo, alvo, anon_id) DO NOTHING;
  SELECT count(*) INTO v_total FROM public.curtida WHERE tipo = p_tipo AND alvo = p_alvo;
  RETURN v_total;
END; $$;
GRANT EXECUTE ON FUNCTION public.curtir(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.descurtir(p_tipo text, p_alvo text, p_anon_id text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total bigint;
BEGIN
  DELETE FROM public.curtida WHERE tipo = p_tipo AND alvo = p_alvo AND anon_id = p_anon_id;
  SELECT count(*) INTO v_total FROM public.curtida WHERE tipo = p_tipo AND alvo = p_alvo;
  RETURN v_total;
END; $$;
GRANT EXECUTE ON FUNCTION public.descurtir(text, text, text) TO anon, authenticated;

CREATE TABLE public.seo_rota (
  caminho text PRIMARY KEY,
  titulo text,
  descricao text,
  og_imagem text,
  noindex boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seo_rota TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_rota TO authenticated;
GRANT ALL ON public.seo_rota TO service_role;
ALTER TABLE public.seo_rota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_rota leitura publica" ON public.seo_rota FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "seo_rota escrita autenticada" ON public.seo_rota FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER seo_rota_updated_at BEFORE UPDATE ON public.seo_rota FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.config_site (
  chave text PRIMARY KEY,
  valor jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.config_site TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config_site TO authenticated;
GRANT ALL ON public.config_site TO service_role;
ALTER TABLE public.config_site ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config leitura publica" ON public.config_site FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "config escrita autenticada" ON public.config_site FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER config_site_updated_at BEFORE UPDATE ON public.config_site FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.config_site (chave, valor) VALUES
  ('ga4_id', '{"id": "", "ativo": false}'::jsonb),
  ('meta_pixel_id', '{"id": "", "ativo": false}'::jsonb),
  ('gtm_id', '{"id": "", "ativo": false}'::jsonb),
  ('site_url', '"https://delatrip-culture-hub.lovable.app"'::jsonb),
  ('modo_construcao', 'true'::jsonb),
  ('sitemap_gerado_em', 'null'::jsonb);

CREATE TABLE public.post (
  slug text PRIMARY KEY,
  titulo text NOT NULL,
  resumo text,
  conteudo_html text,
  capa_url text,
  capa_alt text,
  categoria text,
  autor text,
  publicado boolean NOT NULL DEFAULT false,
  publicado_em timestamptz,
  seo_titulo text,
  seo_descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post TO authenticated;
GRANT ALL ON public.post TO service_role;
ALTER TABLE public.post ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post leitura publicados" ON public.post FOR SELECT TO anon USING (publicado = true);
CREATE POLICY "post leitura autenticada" ON public.post FOR SELECT TO authenticated USING (true);
CREATE POLICY "post escrita autenticada" ON public.post FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_updated_at BEFORE UPDATE ON public.post FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pagina (
  caminho text PRIMARY KEY,
  blocos jsonb,
  atualizado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pagina TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagina TO authenticated;
GRANT ALL ON public.pagina TO service_role;
ALTER TABLE public.pagina ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagina leitura publica" ON public.pagina FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pagina escrita autenticada" ON public.pagina FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER pagina_updated_at BEFORE UPDATE ON public.pagina FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();