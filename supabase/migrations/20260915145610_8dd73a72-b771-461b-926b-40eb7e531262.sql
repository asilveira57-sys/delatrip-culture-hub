CREATE TABLE public.post_excluido (
  slug text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_excluido TO authenticated;
GRANT SELECT ON public.post_excluido TO anon;
GRANT ALL ON public.post_excluido TO service_role;
ALTER TABLE public.post_excluido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_excluido leitura publica" ON public.post_excluido FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post_excluido escrita autenticada" ON public.post_excluido FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER post_excluido_updated_at BEFORE UPDATE ON public.post_excluido FOR EACH ROW EXECUTE FUNCTION set_updated_at();