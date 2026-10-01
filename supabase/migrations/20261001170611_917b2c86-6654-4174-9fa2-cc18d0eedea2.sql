CREATE TABLE public.guia_evento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL CHECK (evento IN ('quiz_iniciado','quiz_concluido','clique_produto_kit')),
  nivel text,
  linha text,
  produto_slug text,
  anon_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guia_evento TO authenticated;
GRANT ALL ON public.guia_evento TO service_role;
ALTER TABLE public.guia_evento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins leem eventos do guia" ON public.guia_evento FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.registrar_evento_guia(p_evento text, p_nivel text, p_linha text, p_produto_slug text, p_anon_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_evento NOT IN ('quiz_iniciado','quiz_concluido','clique_produto_kit') THEN RETURN; END IF;
  INSERT INTO public.guia_evento (evento, nivel, linha, produto_slug, anon_id)
  VALUES (p_evento, left(nullif(p_nivel,''),40), left(nullif(p_linha,''),40), left(nullif(p_produto_slug,''),200), left(nullif(p_anon_id,''),80));
END; $$;
GRANT EXECUTE ON FUNCTION public.registrar_evento_guia(text,text,text,text,text) TO anon, authenticated;

INSERT INTO public.cluster_seo (slug, nome, descricao)
VALUES ('guia-iniciantes','Guia para iniciantes','Conteúdos de apoio ao Guia de acessórios para iniciantes (/comece-aqui).')
ON CONFLICT (slug) DO NOTHING;