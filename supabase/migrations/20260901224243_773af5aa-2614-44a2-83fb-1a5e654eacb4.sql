CREATE TABLE public.relacionado_evento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL CHECK (evento IN ('view','click')),
  bloco text NOT NULL CHECK (bloco IN ('produto','post','link_interno')),
  slug_origem text NOT NULL,
  slug_alvo text NOT NULL,
  posicao integer NOT NULL DEFAULT 0,
  anon_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX relacionado_evento_data_idx ON public.relacionado_evento (created_at DESC);
CREATE INDEX relacionado_evento_origem_idx ON public.relacionado_evento (slug_origem);
CREATE INDEX relacionado_evento_alvo_idx ON public.relacionado_evento (slug_alvo);

GRANT SELECT ON public.relacionado_evento TO authenticated;
GRANT ALL ON public.relacionado_evento TO service_role;

ALTER TABLE public.relacionado_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin autenticado le eventos"
  ON public.relacionado_evento FOR SELECT TO authenticated USING (true);

CREATE TRIGGER relacionado_evento_updated_at
  BEFORE UPDATE ON public.relacionado_evento
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.registrar_evento_relacionado(
  p_evento text,
  p_bloco text,
  p_slug_origem text,
  p_slug_alvo text,
  p_posicao integer,
  p_anon_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_evento NOT IN ('view','click') THEN RAISE EXCEPTION 'evento invalido'; END IF;
  IF p_bloco NOT IN ('produto','post','link_interno') THEN RAISE EXCEPTION 'bloco invalido'; END IF;
  IF coalesce(length(p_slug_origem),0) = 0 OR length(p_slug_origem) > 200 THEN RAISE EXCEPTION 'origem invalida'; END IF;
  IF coalesce(length(p_slug_alvo),0) = 0 OR length(p_slug_alvo) > 200 THEN RAISE EXCEPTION 'alvo invalido'; END IF;
  INSERT INTO public.relacionado_evento (evento, bloco, slug_origem, slug_alvo, posicao, anon_id)
  VALUES (p_evento, p_bloco, p_slug_origem, p_slug_alvo, greatest(coalesce(p_posicao,0),0), left(coalesce(p_anon_id,''),64));
END; $$;

GRANT EXECUTE ON FUNCTION public.registrar_evento_relacionado(text,text,text,text,integer,text) TO anon, authenticated;