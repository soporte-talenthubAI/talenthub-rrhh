-- =====================================================
-- CREAR BUCKET PARA TEMPLATES PDF
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Crear bucket para templates de documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-templates',
  'document-templates',
  true, -- público para poder descargar
  10485760, -- 10MB max
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir lectura pública
CREATE POLICY "Public read access for templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-templates');

-- 3. Política para permitir upload (usuarios autenticados)
CREATE POLICY "Authenticated users can upload templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'document-templates');

-- 4. Política para permitir actualización
CREATE POLICY "Authenticated users can update templates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'document-templates');

-- 5. Política para permitir eliminación
CREATE POLICY "Authenticated users can delete templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'document-templates');

