-- SEO extra fields
ALTER TABLE public.seo_rota
  ADD COLUMN IF NOT EXISTS canonical text,
  ADD COLUMN IF NOT EXISTS nofollow boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS twitter_imagem text;

-- Contato
CREATE TABLE IF NOT EXISTS public.contato_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  categoria text NOT NULL DEFAULT 'geral',
  assunto text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'recebida',
  origem text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contato_mensagem TO authenticated;
GRANT ALL ON public.contato_mensagem TO service_role;
ALTER TABLE public.contato_mensagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contato leitura autenticada" ON public.contato_mensagem FOR SELECT TO authenticated USING (true);
CREATE POLICY "contato escrita autenticada" ON public.contato_mensagem FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER contato_mensagem_updated_at BEFORE UPDATE ON public.contato_mensagem FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- LGPD
CREATE TABLE IF NOT EXISTS public.lgpd_solicitacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  tipo text NOT NULL,
  descricao text NOT NULL,
  status text NOT NULL DEFAULT 'recebida',
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lgpd_solicitacao TO authenticated;
GRANT ALL ON public.lgpd_solicitacao TO service_role;
ALTER TABLE public.lgpd_solicitacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lgpd leitura autenticada" ON public.lgpd_solicitacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "lgpd escrita autenticada" ON public.lgpd_solicitacao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER lgpd_solicitacao_updated_at BEFORE UPDATE ON public.lgpd_solicitacao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Consentimento de cookies
CREATE TABLE IF NOT EXISTS public.consentimento_cookie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id text NOT NULL,
  versao text NOT NULL,
  categorias jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consentimento_cookie TO authenticated;
GRANT ALL ON public.consentimento_cookie TO service_role;
ALTER TABLE public.consentimento_cookie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consentimento leitura autenticada" ON public.consentimento_cookie FOR SELECT TO authenticated USING (true);
CREATE TRIGGER consentimento_cookie_updated_at BEFORE UPDATE ON public.consentimento_cookie FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Documentos legais
CREATE TABLE IF NOT EXISTS public.documento_legal (
  chave text PRIMARY KEY,
  titulo text NOT NULL,
  conteudo_html text NOT NULL DEFAULT '',
  versao text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'rascunho',
  publicado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documento_legal TO authenticated;
GRANT SELECT ON public.documento_legal TO anon;
GRANT ALL ON public.documento_legal TO service_role;
ALTER TABLE public.documento_legal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documento leitura publicada" ON public.documento_legal FOR SELECT TO anon USING (status = 'publicado');
CREATE POLICY "documento leitura autenticada" ON public.documento_legal FOR SELECT TO authenticated USING (true);
CREATE POLICY "documento escrita autenticada" ON public.documento_legal FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER documento_legal_updated_at BEFORE UPDATE ON public.documento_legal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.documento_legal_versao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL REFERENCES public.documento_legal(chave) ON DELETE CASCADE,
  titulo text NOT NULL,
  conteudo_html text NOT NULL,
  versao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.documento_legal_versao TO authenticated;
GRANT ALL ON public.documento_legal_versao TO service_role;
ALTER TABLE public.documento_legal_versao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versao legal autenticada" ON public.documento_legal_versao FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Podcast
CREATE TABLE IF NOT EXISTS public.podcast_episodio (
  slug text PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  resumo text,
  conteudo_html text,
  capa_url text,
  capa_alt text,
  data_publicacao date,
  participantes text,
  spotify_url text,
  youtube_url text,
  outro_url text,
  transcricao text,
  duracao text,
  publicado boolean NOT NULL DEFAULT false,
  seo_titulo text,
  seo_descricao text,
  seo_keywords text,
  og_imagem text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.podcast_episodio TO authenticated;
GRANT SELECT ON public.podcast_episodio TO anon;
GRANT ALL ON public.podcast_episodio TO service_role;
ALTER TABLE public.podcast_episodio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "podcast leitura publicada" ON public.podcast_episodio FOR SELECT TO anon USING (publicado = true);
CREATE POLICY "podcast leitura autenticada" ON public.podcast_episodio FOR SELECT TO authenticated USING (true);
CREATE POLICY "podcast escrita autenticada" ON public.podcast_episodio FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER podcast_episodio_updated_at BEFORE UPDATE ON public.podcast_episodio FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Funções públicas com limite anti-spam
CREATE OR REPLACE FUNCTION public.registrar_contato(
  p_nome text, p_email text, p_telefone text, p_categoria text,
  p_assunto text, p_mensagem text, p_origem text, p_utm jsonb, p_ip_hash text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid; v_recentes int;
BEGIN
  IF coalesce(length(trim(p_nome)),0) < 2 OR length(p_nome) > 120 THEN RAISE EXCEPTION 'nome invalido'; END IF;
  IF p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(p_email) > 200 THEN RAISE EXCEPTION 'email invalido'; END IF;
  IF coalesce(length(trim(p_mensagem)),0) < 10 OR length(p_mensagem) > 4000 THEN RAISE EXCEPTION 'mensagem invalida'; END IF;
  IF coalesce(length(trim(p_assunto)),0) < 2 OR length(p_assunto) > 160 THEN RAISE EXCEPTION 'assunto invalido'; END IF;
  SELECT count(*) INTO v_recentes FROM public.contato_mensagem
    WHERE ip_hash IS NOT NULL AND ip_hash = p_ip_hash AND created_at > now() - interval '10 minutes';
  IF v_recentes >= 3 THEN RAISE EXCEPTION 'limite de envios atingido'; END IF;
  INSERT INTO public.contato_mensagem (nome,email,telefone,categoria,assunto,mensagem,origem,utm,ip_hash)
  VALUES (left(trim(p_nome),120), lower(trim(p_email)), left(coalesce(p_telefone,''),40), coalesce(p_categoria,'geral'),
          left(trim(p_assunto),160), left(trim(p_mensagem),4000), left(coalesce(p_origem,''),200), coalesce(p_utm,'{}'::jsonb), p_ip_hash)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_contato(text,text,text,text,text,text,text,jsonb,text) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_contato(text,text,text,text,text,text,text,jsonb,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_lgpd(
  p_nome text, p_email text, p_tipo text, p_descricao text, p_ip_hash text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid; v_recentes int;
BEGIN
  IF coalesce(length(trim(p_nome)),0) < 2 OR length(p_nome) > 120 THEN RAISE EXCEPTION 'nome invalido'; END IF;
  IF p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(p_email) > 200 THEN RAISE EXCEPTION 'email invalido'; END IF;
  IF coalesce(length(trim(p_descricao)),0) < 10 OR length(p_descricao) > 4000 THEN RAISE EXCEPTION 'descricao invalida'; END IF;
  SELECT count(*) INTO v_recentes FROM public.lgpd_solicitacao
    WHERE ip_hash IS NOT NULL AND ip_hash = p_ip_hash AND created_at > now() - interval '10 minutes';
  IF v_recentes >= 3 THEN RAISE EXCEPTION 'limite de envios atingido'; END IF;
  INSERT INTO public.lgpd_solicitacao (nome,email,tipo,descricao,ip_hash)
  VALUES (left(trim(p_nome),120), lower(trim(p_email)), coalesce(p_tipo,'outros'), left(trim(p_descricao),4000), p_ip_hash)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_lgpd(text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_lgpd(text,text,text,text,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_consentimento(
  p_anon_id text, p_versao text, p_categorias jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF coalesce(length(p_anon_id),0) < 8 OR length(p_anon_id) > 64 THEN RAISE EXCEPTION 'anon_id invalido'; END IF;
  INSERT INTO public.consentimento_cookie (anon_id, versao, categorias)
  VALUES (p_anon_id, left(coalesce(p_versao,'1.0'),20), coalesce(p_categorias,'{}'::jsonb));
END; $$;
REVOKE ALL ON FUNCTION public.registrar_consentimento(text,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_consentimento(text,text,jsonb) TO anon, authenticated, service_role;

-- Documentos legais iniciais (rascunho, texto padrão vem do código)
INSERT INTO public.documento_legal (chave, titulo, conteudo_html, versao, status) VALUES
  ('privacidade', 'Política de Privacidade', '', '1.0', 'rascunho'),
  ('cookies', 'Política de Cookies', '', '1.0', 'rascunho'),
  ('termos', 'Termos de Uso', '', '1.0', 'rascunho'),
  ('lgpd', 'LGPD e seus direitos', '', '1.0', 'rascunho'),
  ('maiores18', 'Conteúdo para maiores de 18 anos', '', '1.0', 'rascunho')
ON CONFLICT (chave) DO NOTHING;