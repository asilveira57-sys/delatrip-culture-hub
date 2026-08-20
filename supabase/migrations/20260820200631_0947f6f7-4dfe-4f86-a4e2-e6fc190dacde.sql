CREATE TABLE public.faq_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('post','produto','marca')),
  alvo text NOT NULL,
  pergunta text NOT NULL,
  resposta text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  origem text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX faq_item_alvo_idx ON public.faq_item (tipo, alvo, ordem);

GRANT SELECT ON public.faq_item TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_item TO authenticated;
GRANT ALL ON public.faq_item TO service_role;

ALTER TABLE public.faq_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq leitura publica" ON public.faq_item FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "faq escrita autenticada" ON public.faq_item FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER faq_item_updated_at BEFORE UPDATE ON public.faq_item
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();