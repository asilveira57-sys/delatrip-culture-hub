CREATE TABLE public.guia_kit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  nivel text CHECK (nivel IN ('explorador','familiarizado','entusiasta','especialista')),
  linha text CHECK (linha IN ('entrada','normal','premium')),
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guia_kit TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guia_kit TO authenticated;
GRANT ALL ON public.guia_kit TO service_role;
ALTER TABLE public.guia_kit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público lê kits ativos" ON public.guia_kit FOR SELECT TO anon USING (ativo = true);
CREATE POLICY "Autenticado gerencia kits" ON public.guia_kit FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER guia_kit_updated_at BEFORE UPDATE ON public.guia_kit FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.guia_kit_item (
  kit_id uuid NOT NULL REFERENCES public.guia_kit(id) ON DELETE CASCADE,
  produto_slug text NOT NULL,
  papel text NOT NULL CHECK (papel IN ('principal','complemento','armazenamento','transporte')),
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kit_id, produto_slug)
);
GRANT SELECT ON public.guia_kit_item TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guia_kit_item TO authenticated;
GRANT ALL ON public.guia_kit_item TO service_role;
ALTER TABLE public.guia_kit_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público lê itens de kits ativos" ON public.guia_kit_item FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.guia_kit k WHERE k.id = kit_id AND k.ativo));
CREATE POLICY "Autenticado gerencia itens" ON public.guia_kit_item FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER guia_kit_item_updated_at BEFORE UPDATE ON public.guia_kit_item FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();