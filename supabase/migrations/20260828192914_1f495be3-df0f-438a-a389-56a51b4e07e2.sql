CREATE TABLE public.marca_overlay (
  slug text PRIMARY KEY,
  nome text,
  mesclar_em text,
  oculto boolean NOT NULL DEFAULT false,
  manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marca_overlay TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marca_overlay TO authenticated;
GRANT ALL ON public.marca_overlay TO service_role;

ALTER TABLE public.marca_overlay ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marca leitura publica" ON public.marca_overlay
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "marca escrita autenticada" ON public.marca_overlay
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER marca_overlay_updated_at
  BEFORE UPDATE ON public.marca_overlay
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();