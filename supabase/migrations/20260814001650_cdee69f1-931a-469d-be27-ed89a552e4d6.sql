CREATE POLICY "blog leitura autenticada" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'blog');
CREATE POLICY "blog envio autenticado" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog');
CREATE POLICY "blog atualizacao autenticada" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'blog') WITH CHECK (bucket_id = 'blog');
CREATE POLICY "blog remocao autenticada" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'blog');